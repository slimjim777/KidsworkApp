var BASE_URL = "http://192.168.1.64:5000/rest/v1.0/";

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
    console.log("Route:");
    console.log(hash);
    
    var action_in;
    if (context.action === 'Sign-In') {
        action_in = true;
    } else {
        action_in = false;
    }    
    
    if (!hash) {
        this.homePage = new HomeView({}).render()
        page = this.homePage.el;
        $('body').html(page);
    } else if (hash.match(/^#events/)) {
        controller.events();
    } else if (hash.match(/^#family/)) {
        var familyData = {action: context.action, eventName: context.eventName, action_in:action_in };
        this.familyPage = new FamilyView(familyData).render();
        page = this.familyPage.el;
        $('body').html(page);
    } else if (hash.match(/^#overview/)) {
        controller.registrations();
    } else if (hash.match(/^#register/)) {
        var registerData;
        if (context.family) {
            registerData = context.family;
        } else {
            registerData = {};
        }
        registerData.action = context.action;
        registerData.action_in = action_in;
        context.action_list = [];
        registerData.action_list = [];
        if (context.action === 'Sign-In') {
            registerData.action_in = action_in;
        } else {
            registerData.action_in = action_in;
        }
        this.registerPage = new RegisterView(registerData).render();
        page = this.registerPage.el;
        $('body').html(page);
    } else if (hash.match(/^#scan/)) {
        alert("Not yet implemented");
    } else if (hash.match(/^#write_tag/)) {
        alert("Not yet implemented");
    }
    
  }
};


var controller = {

    events: function() {
        spinner('show');
        if (!app.eventsPage) {
            console.log(BASE_URL + 'events');
            $.getJSON(BASE_URL + 'events', function(data) {
                app.eventsPage = new EventsView(data.result).render();
                page = app.eventsPage.el;
                $('body').html(page);
                spinner('hide');
            });
        } else {
            // Show the events that were previously fetched
            page = app.eventsPage.el;
            $('body').html(page);
            spinner('hide');
        }
    },

    // Get the registrations for the event
    registrations: function(tag) {
        spinner('show');
        var reg_data = {
            "event_id": context.eventId
        };
        
        var overviewData = {name: context.eventName, eventId: context.eventId};
    
        var request = $.ajax({
            type: "POST",
            url: BASE_URL + "registrations",
            contentType:"application/json",
            dataType: "json",
            data: JSON.stringify(reg_data),
            success: function(data) {
                if ('error' in data) {
                    showMessage($('#f-message'), data.error, false, false);
                    spinner('hide');
                } else {
                    // Got the registrations
                    overviewData.records = data.result;
                    app.overviewPage = new OverviewView(overviewData).render();
                    page = app.overviewPage.el;
                    $('body').html(page);
                    
                    // Format the list
                    var options = {
                        valueNames: ['name', 'group','team','school_year','stage']
                    };
                    var list = new List('registrations', options);
                    spinner('hide');
                }
            },
            error: function(error) {
                showMessage($('#f-message'), error.statusText, false);
                spinner('hide');
                return null;
            }
        });   
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
        spinner('show');
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
                    spinner('hide');
                } else {
                    // Store the family details and call the register view
                    context.family = data;
                    window.location.hash = '#register';
                    spinner('hide');
                }
            },
            error: function(error) {
                showMessage($('#f-message'), error.statusText, false);
                spinner('hide');
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
        if (item.length !== 0) {
            // Act as though the child was clicked
            this.childClicked(null, item[0]);
        }
    },
    
    // Register the children in the action list
    register: function() {
        spinner('show');
        var register_data = {
            family_number: context.familyTag,
            event_id: context.eventId,
            people: []      
        };
        
        for (i in context.action_list) {
            p = context.action_list[i];
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
                    spinner('hide');
                } else {
                    // Store the family details and call the register view
                    showMessage($('#f-message'), "Done! Next!", true, false);
                    window.location.hash = '#family';
                    spinner('hide');
                }
            },
            error: function(error) {
                showMessage($('#f-message'), error.statusText, false);
                spinner('hide');
                return null;
            }
        });        
        
    },
    
    spinner: function() {
        return '<div id="circularG">' +
                '<div id="circularG_1" class="circularG">' +
                '</div>' +
                '<div id="circularG_2" class="circularG">' +
                '</div>' +
                '<div id="circularG_3" class="circularG">' +
                '</div>' +
                '<div id="circularG_4" class="circularG">' +
                '</div>' +
                '<div id="circularG_5" class="circularG">' +
                '</div>' +
                '<div id="circularG_6" class="circularG">' +
                '</div>' +
                '<div id="circularG_7" class="circularG">' +
                '</div>' +
                '<div id="circularG_8" class="circularG">' +
                '</div>' +
                '</div>';
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

function spinner(act) {
    if (act === "show") {
        $('div.content').prepend(controller.spinner);
    } else {
        $('#circularG').remove();
    }
}
