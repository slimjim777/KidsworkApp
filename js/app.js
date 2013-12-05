var BASE_URL = "http://192.168.1.64:5000/rest/v1.0/";
var MIMETYPE = 'text/kidswork';

var context = {
    authenticated: null,
    eventId: null,
    eventName: null,
    familyId: null,
    familyTag: null,
    family: null,
    action: null,
    action_list: null,
    tagToWrite: null,
    storeEvent: function(eventid, name) {
        this.eventId = eventid;
        this.eventName = name;
    },
    storeAction: function(act) {
        this.action = act;
    },
    regList: null,
    filterGroup: 'All',
    filterStage: 'All',
    login_data: null
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
    if(nfc){
      nfc.addNdefListener(function (nfcEvent) {
        nfcActivity(nfcEvent); // TODO uncomment me
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
    
    //console.log(hash);
    
    // Handle authentication
    if ((!context.authenticated) && (!hash.match(/^#login/))) {
        hash = '#login';
    }
    
    var action_in;
    if (context.action === 'Sign-In') {
        action_in = true;
    } else {
        action_in = false;
    }    
    
    // Handling page routing
    if (!hash) {
        this.homePage = new HomeView({}).render();
        page = this.homePage.el;
        $('body').html(page);
        
    } else if (hash.match(/^#login/)) {
        // Get the stored values
        var user = window.localStorage.getItem('username');
        var url = window.localStorage.getItem('url');
        if (!url) {
            url = 'https://';
        }
        var login_data = {
            username: user,
            url: url
        };
        
        this.loginPage = new LoginView(login_data).render();
        page = this.loginPage.el;
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
        this.scanPage = new ScanTagView({}).render();
        page = this.scanPage.el;
        $('body').html(page);
    } else if (hash.match(/^#writetag/)) {
        this.writePage = new WriteTagView({}).render();
        page = this.writePage.el;
        $('body').html(page);        
    }
    
  }
};


var controller = {

    login: function(ev) {
        ev.preventDefault();
        
        var user = $('#username').val();
        var password = $('#password').val();
        var url = $('#url').val();
        
        if ((!user) || (!password) || (!url)) {
            showMessage(null, 'All fields need to be entered', false, false);
            return;
        }
        
        // Save the url and try logging in
        spinner('show');
        BASE_URL = url + '/rest/v1.0/';
        
        var login_data = {
            'username': user,
            'password': password
        };
        
        var request = $.ajax({
            type: "POST",
            url: BASE_URL + "login",
            contentType:"application/json",
            dataType: "json",
            data: JSON.stringify(login_data),
            success: function(data) {
                if ('error' in data) {
                    showMessage(null, data.error, false, false);
                    spinner('hide');
                } else {
                    // Login successful
                    context.authenticated = true;
                    context.login_data = login_data;
                    window.localStorage.setItem('username', login_data.username);
                    window.localStorage.setItem('url', url);
                    window.location.hash = '#';
                    spinner('hide');
                    app.route();
                }
            },
            error: function(error) {
                if (error.status == '403') {
                    showMessage(null, "Error logging in. Please check your credentials", false, false);
                } else {
                    showMessage(null, error.responseText, false, false);
                }
                spinner('hide');
                return null;
            }
        });        
        
    },

    events: function() {
        spinner('show');
        if (!app.eventsPage) {
            var request = $.ajax({
                type: "POST",
                url: BASE_URL + "events",
                contentType:"application/json",
                dataType: "json",
                data: JSON.stringify(context.login_data),
                success: function(data) {
                    app.eventsPage = new EventsView(data.result).render();
                    page = app.eventsPage.el;
                    $('body').html(page);
                    spinner('hide');
                },
                error: function(error) {
                    if (error.status == '403') {
                        showMessage(null, "Error logging in. Please check your credentials", false, false);
                    } else {
                        showMessage(null, error.responseText, false, false);
                    }
                    spinner('hide');
                    return null;
                }
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
            "event_id": context.eventId,
            "username": context.login_data.username,
            "password": context.login_data.password
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
                    context.regList = new List('registrations', options);
                    
                    $('#o-all').click( controller.listSelect );
                    $('#o-preschool').click( controller.listSelect );
                    $('#o-primary').click( controller.listSelect );
                    $('#o-r-all').click( controller.radioSelect );
                    $('#o-r-in').click( controller.radioSelect );
                    $('#o-r-out').click( controller.radioSelect );
                    
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
            "event_id": context.eventId,
            "username": context.login_data.username,
            "password": context.login_data.password
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
                    app.route();
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
            var item = '<li><a href="#register" name="' + el.name + '-act" id="' + el.id + '-act"' + ' onclick="controller.childRemove(event, this)">'
                        + $(el).html().replace('+','x') +'</a></li>';
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
            people: [],
            username: context.login_data.username,
            password: context.login_data.password
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
                    app.route();
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
    },

    radioSelect: function () {
        var value = $(this).text();
        context.filterStage = $.trim(value);
        var $el = $(this);
        $el.siblings().removeClass('active');
        $el.addClass('active');
        controller.listFilter();
        return false;    
    },
        
    listSelect: function () {
        var value = $(this).text();
        context.filterGroup = $.trim(value);
        var $li = $(this).parent();
        $li.siblings().removeClass('active');
        $li.addClass('active');
        controller.listFilter();
        return false;    
    },
    
    listFilter: function () {
        context.regList.filter(function(item) {
            var result1 = false;
            var result2 = false;
            
            // Check the groups
            if (context.filterGroup === 'All') {
                result1 = true;
            } else if ($.trim(item.values().group) === context.filterGroup) {
                result1 = true;
            }
            
            // Check the status
            if (context.filterStage === 'All') {
                result2 = true;
            } else if ($.trim(item.values().stage) === context.filterStage) {
                result2 = true;
            }
            
            if ((result1) && (result2)) {
                return true;
            } else {
                return false;            
            }
        });
    },
    
    writeTag: function() {
        context.tagToWrite = null;
        var prefix = $("input[name=w-radio]:checked").val();
        var tag = $('#w-tag').val().replace(' ','');
        tag = $.trim(tag);
        
        if (!tag) {
            showMessage(null, "Dude, where's the tag number?", false, false);
            return;
        }
        
        context.tagToWrite = prefix + tag;
        showMessage(null, "Scan the tag to write code '" + prefix + tag + "'", true, true);
    },
    
    // Scan the tag and get the person details
    scanTagEnter: function(ev) {
        ev.preventDefault();
        if (ev.keyCode==13) {
            var tag = $('#s-tag').val();
            var prefix = $("input[name=s-radio]:checked").val();
            this.scanTag(prefix + tag);
        }
    },

    // Scan the tag and get the person details
    scanTag: function(tag) {
        spinner('show');
        // Get the image tag
        var img = $('#s-image');
        var scan_data = {
            "tag": tag,
            "username": context.login_data.username,
            "password": context.login_data.password            
        };
    
        var request = $.ajax({
            type: "POST",
            url: BASE_URL + "scan",
            contentType:"application/json",
            dataType: "json",
            data: JSON.stringify(scan_data),
            success: function(data) {
                if ('error' in data) {
                    showMessage(null, data.error, false, false);
                    spinner('hide');
                } else {
                    // Display the details from the tag
                    if (tag.charAt(0)==='F') {
                        data.result.isFamily = true;
                    } else {
                        data.result.isFamily = false; 
                    }
                    this.scanPage = new ScanTagView(data.result).render();
                    page = this.scanPage.el;
                    $('body').html(page);
                    spinner('hide');
                }
            },
            error: function(error) {
                showMessage(null, error.statusText, false);
                spinner('hide');
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
    alert('Ignore scan for home page');
    return;
  }
  
  if (hash.match(/^#writetag/)) { // do we have an action to write or not?
    // Bail out if the tagToWrite isn't set
    if (!context.tagToWrite) {
        this.writeTag();
    }
    
    // Format the NDEF record
    var ndefRecord = ndef.mimeMediaRecord(MIMETYPE, nfc.stringToBytes(context.tagToWrite));
    
    nfc.write([ndefRecord], function () {
        showMessage(null, "Tag written successfully with code " + context.tagToWrite, true, false);
    }, function (reason) {
        showMessage(null, "Failed to write tag: " + JSON.stringify(reason), false, false);
    });
    
  } else {
    // Read NFC tag
	var tag = nfcEvent.tag;
	var tagData = nfc.bytesToString(tag.ndefMessage[0].payload); // TODO make this less fragile 

    // Analyse the prefix and tag Number
    var groups = tagData.match(/(^[FCL])(\d+$)/);
    if ((!groups) || (groups.length != 3)) {
        showMessage($('f-familyid'), "The tag number is invalid: " + tagData, false, false);
        return; 
    }

    // Store the tag details
    tagPrefix = groups[1];
    tagNumber = groups[2];
	
	if (hash.match(/^#family/)) {
	    if (tagPrefix === 'F') {
	        // We're on the family screen and are expecting a family tag
	        controller.familyByTag(tagNumber);
	    } else {
	        // We're on the family screen and got an unexpected tag
	        showMessage($('f-message'), "The tag number is invalid: " + tagData, false, false);
        }
        
	} else if (hash.match(/^#register/)) {
	    if (tagPrefix === 'C') {
	        // We're on the register screen and are expecting a child tag
	        controller.childByTag(tagNumber);
	    } else {
	        // We're on the family screen and got an unexpected tag
	        showMessage($('r-message'), "The tag number is invalid: " + tagData, false, false);
        }
        
	} else if (hash.match(/^#scan/)) {
	    // On the scan tag page
	    controller.scanTag(tagPrefix + tagNumber);
	    
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
        el.slideDown('slow').delay(5000).slideToggle('slow', function() {$(this).remove();});
    }
    
}

function spinner(act) {
    if (act === "show") {
        $('div.content').prepend(controller.spinner);
    } else {
        $('#circularG').remove();
    }
}
