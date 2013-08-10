var BASE_URL = "http://192.168.1.64:5000/rest/v1.0/";
var slider = new PageSlider($("body"));

var context = {
    eventId: null,
    eventName: null,
    familyId: null,
    familyTag: null,
    storeEvent: function(eventid, name) {
        this.eventId = eventid;
        this.eventName = name;
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
        this.familyPage = new FamilyView({}).render();
        page = this.familyPage.el;
        $('body').html(page);
        //slider.slidePage($(page));          
        
    } else if (hash.match(/^#register/)) {
        this.registerPage = new RegisterView({}).render();
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
                    console.log(showMessage);
                    showMessage($('#f-message'), data.error, false, false);
                } else {
                    app.registerPage = new RegisterView(data).render();
                    var page = app.registerPage.el;
                    $('body').html(page);
                    //slider.slidePage($(page));  
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
  console.log("Tag found, yay!");
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
    // read
	console.log("Reading");
	var tag = nfcEvent.tag;
	var tagData = nfc.bytesToString(ring.ndefMessage[0].payload); // TODO make this less fragile 
	alert(tagData);

    // Analyse the prefix and tag Number
    var groups = tagData.match(/(^[FCL])(\d+$)/);
    if ((!groups) || (groups.length != 3)) {
        alert($('f-familyid'), "The tag number is invalid: " + prefix_tag);
        showMessage("The tag number is invalid: " + prefix_tag, false);
        return; 
    }

    // Store the tag details
    tagPrefix = groups[1];
    tagNumber = groups[2];
	
	if (($('f-familyid')) && (tagPrefix === 'F')) {
	    // We're on the family screen and are expecting a family tag
	    controller.familyByTag(tagNumber);
	}
	
  }
}

function showMessage(el, words, success, hold) {
    if (success) {
        el.removeClass( "message error" );
        el.addClass( "message success" );

    } else {
        el.removeClass( "message success" );
        el.addClass( "message error" );    
    }

    el.html('<h3>' + words + '</h3>');
    if (!hold) {
        el.slideDown('slow').delay(1000).slideToggle('slow');
    } else {
        el.slideDown('slow');
    }
}
