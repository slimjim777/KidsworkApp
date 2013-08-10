
var slider = new PageSlider($("body"));


var app = {
  initialize: function () {
    this.bind();
    
    var self = this;
    self.route();
  },
  
  bind: function () {
    document.addEventListener('deviceready', this.deviceready, false);
  },
  
  deviceready: function () {
    // note that this is an event handler so the scope is that of the event
    // so we need to call app.report(), and not this.report()
    console.log('deviceready');
    if(nfc){
      nfc.addNdefListener(function (nfcEvent) {
        ring(nfcEvent); // TODO uncomment me
        console.log("Attempting to bind to NFC");
      }, function () {
        console.log("Success.  Listening for rings..");
      }, function () {
        alert("NFC Functionality is not working, is NFC enabled on your device?");
      });
    }
  },
  
  route: function() {
    var hash = window.location.hash;
    console.log(hash);
    
    if (!hash) {
        this.homePage = new HomeView({}).render();
        var page = this.homePage.el;
        slider.slidePage($(page));          
    }
  
  }
};



// We have the tag in a global object
function ring(nfcEvent) { // On NFC Activity..
  console.log("Tag found, yay!");
  var action = "";
  
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
	console.log(nfcEvent);
	var ring = nfcEvent.tag;
	console.log(ring);
	ringData = nfc.bytesToString(ring.ndefMessage[0].payload); // TODO make this less fragile 
	alert(ringData);
	
  }
}
