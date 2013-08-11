var BASE_URL = "http://192.168.1.64:5000/rest/v1.0/";
var slider = new PageSlider($("body"));

var context = {
    eventId: null,
    eventName: null,
    familyId: null,
    familyTag: null,
    family: null,
    action: null,
    action_list: null,
    storeEvent: function(eventid, name) {
        this.eventId = eventid;
        this.eventName = name;
    },
    storeAction: function(act) {
        this.action = act;
    }
};

var app = {
  initialize: function () {
    this.bind();
    
    var self = this;
    self.route();
  },
  
  bind: function () {
    document.addEventListener('deviceready', this.deviceready, false);
    $(window).on('hashchange', $.proxy(this.route, this));
  },
  
  deviceready: function () {
    // note that this is an event handler so the scope is that of the event
    // so we need to call app.report(), and not this.report()
    console.log('deviceready');
    if(nfc){
      nfc.addNdefListener(function (nfcEvent) {
        nfcActivity(nfcEvent); // TODO uncomment me
        console.log("Attempting to bind to NFC");
      }, function () {
        console.log("Success.  Listening for tags..");
      }, function () {
        alert("NFC Functionality is not working, is NFC enabled on your device?");
      });
    }
  },
  
  route: function() {
    var hash = window.location.hash;
    var page;
    console.log(hash);
    
    if (!hash) {
        controller.events();
        //this.eventsPage = new EventsView({}).render();
        //var page = this.eventsPage.el;
        //slider.slidePage($(page));          
    } else if (hash.match(/^#family/)) {
        var familyData = {action: context.action, eventName: context.eventName};
        this.familyPage = new FamilyView(familyData).render();
        page = this.familyPage.el;
        $('body').html(page);
        //slider.slidePage($(page));          
    } else if (hash.match(/^#overview/)) {
        var overviewData = {name: context.eventName, eventId: context.eventId};
        this.overviewPage = new OverviewView(overviewData).render();
        page = this.overviewPage.el;
        $('body').html(page);
        //slider.slidePage($(page));
    } else if (hash.match(/^#register/)) {
        var registerData;
        if (context.family) {
            overviewData = context.family;
        } else {
            overviewData = {};
        }
        overviewData.action = context.action;
        context.action_list = [];
        overviewData.action_list = [];
        if (context.action === 'Sign-In') {
            overviewData.action_in = true;
        } else {
            overviewData.action_in = false;
        }
        this.registerPage = new RegisterView(overviewData).render();
        page = this.registerPage.el;
        $('body').html(page);
        //slider.slidePage($(page));
    }
    
  }
};


var controller = {

    events: function() {
        //$('body').append('Please wait...');
        if (!app.eventsPage) {
            $.getJSON(BASE_URL + 'events', function(data) {
                app.eventsPage = new EventsView(data.result).render();
                page = app.eventsPage.el;
                $('body').html(page);
                //slider.slidePage($(page));  
            
            });
        } else {
            // Show the events that were previously fetched
            page = app.eventsPage.el;
            $('body').html(page);
        }
    },
    
    // Family tag entered manually
    familyTagEnter: function(ev) {
        if (ev.keyCode==13) {
            var familyId = $('#f-familyid').val();
            this.familyByTag(familyId);
        }
    },
    
    // Get the family details using the tag number
    familyByTag: function(tag) {
        context.familyTag = tag;
        var family_data = {
            "family_number": context.familyTag,
            "event_id": context.eventId
        };
    
        var request = $.ajax({
            type: "POST",
            url: BASE_URL + "family",
            contentType:"application/json",
            dataType: "json",
            data: JSON.stringify(family_data),
            success: function(data) {
                if ('error' in data) {
                    showMessage($('#f-message'), data.error, false, false);
                } else {
                    // Store the family details and call the register view
                    context.family = data;
                    window.location.hash = '#register';
                    //app.registerPage = new RegisterView(data).render();
                    //var page = app.registerPage.el;
                    //$('body').html(page);
                    //slider.slidePage($(page));  
                }
            },
            error: function(error) {
                showMessage($('#f-message'), error.statusText, false);
                return null;
            }
        });   
    },
    
    // Child selected by click
    childClicked: function(ev, el)
    {
        if (ev) {
            ev.preventDefault();
        }
         
        // Check if the child is already in the signed-in/out list
        var found = false;
        for (var i in context.action_list) {
            e = context.action_list[i];
            if (el.id == 'k-' + e.tagnumber) {
                found = true;
            }
        }
    
        // Add the child to the sign-in/out list (if not already there)           
        var $act_list = $('#r-action-list');
        if (!found) {
            context.action_list.push({ tagnumber: el.id.replace('k-',''), personid: el.name.replace('k-',''), name: $(el).text().replace('+','')});
            var item = '<li><a href="#register" name="' + el.name + '-act" id="' + el.id + '-act"' + ' onclick="controller.childRemove(event, this)">'+ $(el).html().replace('+','x') +'</a></li>';
            $act_list.append(item);
        }
    },
    
    // Child removed from action list by click
    childRemove: function(ev, el)
    {
        ev.preventDefault();
    
        // Remove the record from the action list
        //var found = false;
        for (var i in context.action_list) {
            e = context.action_list[i];
            if (el.id == 'k-' + e.tagnumber + '-act') {
                context.action_list.splice(i,1);
            }
        }
        $(el).parent().remove();
    },

    // Get the child details using the tag number
    childTagEnter: function(ev) {
        // Add the child to the list of people to sign-in/out
        ev.preventDefault();
        if (ev.keyCode==13) {
            var childTag = $('#r-kid').val();
            this.childByTag(childTag);
        }
    },

    // Get the child details using the tag number
    childByTag: function(tag) {
        // Get the item for the child
        var item = $('#k-' + tag);
        console.log(item);
        if (item.length !== 0) {
            // Act as though the child was clicked
            this.childClicked(null, item[0]);
        }
    },
    
    // Register the children in the action list
    register: function() {
        var register_data = {
            family_number: context.familyTag,
            event_id: context.eventId,
            people: []      
        };
        
        for (i in context.action_list) {
            p = context.action_list[i];
            console.log(p);
            register_data.people.push(p.tagnumber);
        }
        
        var url;
        if (context.action === 'Sign-In') {
            url = BASE_URL + "sign-in";
        } else {
            url = BASE_URL + "sign-out";
        }

        var request = $.ajax({
            type: "POST",
            url: url,
            contentType:"application/json",
            dataType: "json",
            data: JSON.stringify(register_data),
            success: function(data) {
                if ('error' in data) {
                    showMessage($('#f-message'), data.error, false, false);
                } else {
                    // Store the family details and call the register view
                    showMessage($('#f-message'), "Done! Next!", true, false);
                    window.location.hash = '#family'; 
                }
            },
            error: function(error) {
                showMessage($('#f-message'), error.statusText, false);
                return null;
            }
        });        
        
    }

};


// We have the tag in a global object
function nfcActivity(nfcEvent) { // On NFC Activity..
  var action = "";
  
  var hash = window.location.hash;
  if (!hash) {
    alert('Ignore scan for events page');
    return;
  }
  
  if (action !== "") { // do we have an action to write or not?
	// write
    // from https://github.com/don/phonegap-nfc-writer/blob/master/assets/www/main.js
    var newUrl = actions[action].format(option);
    console.log("New URL", newUrl);
    var ndefRecord = ndef.uriRecord(newUrl); // support more types.. TODO

    nfc.write([ndefRecord], function () {
      navigator.notification.vibrate(100);
      console.log("Written", ndefRecord);
      alert("Woohoo!  Your tag is ready.");
    }, function (reason) {
      console.log("Inlay write failed");
    });
	
  } else {
    // Read NFC tag
	var tag = nfcEvent.tag;
	var tagData = nfc.bytesToString(tag.ndefMessage[0].payload); // TODO make this less fragile 
	//alert(tagData);

    // Analyse the prefix and tag Number
    var groups = tagData.match(/(^[FCL])(\d+$)/);
    if ((!groups) || (groups.length != 3)) {
        alert($('f-familyid'), "The tag number is invalid: " + tagData);
        showMessage($('f-familyid'), "The tag number is invalid: " + tagData, false, false);
        return; 
    }

    // Store the tag details
    tagPrefix = groups[1];
    tagNumber = groups[2];
	
	if ((hash.match(/^#family/)) && (tagPrefix === 'F')) {
	    // We're on the family screen and are expecting a family tag
	    controller.familyByTag(tagNumber);
	} else if ((hash.match(/^#family/)) && (tagPrefix !== 'F')) {
	    // We're on the family screen and got an unexpected tag
	    showMessage($('f-message'), "The tag number is invalid: " + tagData, false, false);
	} else if ((hash.match(/^#register/)) && (tagPrefix === 'C')) {
	    // We're on the register screen and are expecting a child tag
	    controller.childByTag(tagNumber);
	} else if ((hash.match(/^#register/)) && (tagPrefix !== 'C')) {
	    // We're on the family screen and got an unexpected tag
	    showMessage($('r-message'), "The tag number is invalid: " + tagData, false, false);
    } else {
        alert("The tag number is invalid: " + tagData);
    }
  }
  
}

function showMessage(elem, words, success, hold) {
    $('div.content').prepend('<h3 id="message"></h3');
    var el = $('#message');
    el.hide();

    if (success) {
        el.removeClass( "message error" );
        el.addClass( "message success" );

    } else {
        el.removeClass( "message success" );
        el.addClass( "message error" );    
    }

    el.html('<h3>' + words + '</h3>');
    if (!hold) {
        el.slideDown('slow').delay(1000).slideToggle('slow', function() {$(this).remove();});
    } else {
        el.slideDown('slow', function() {$(this).remove();});
    }
    
}
