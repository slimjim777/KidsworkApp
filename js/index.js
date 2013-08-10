/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var BASE_URL = "http://192.168.1.64:5000/rest/v1.0/";

var slider = new PageSlider($("body"));

 
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        
        // Compile templates
        //this.homeTpl = Handlebars.compile($("#home-tpl").html());
        //this.employeeLiTpl = Handlebars.compile($("#employee-li-tpl").html());
        
        var self = this;
        this.familyURL = /^#family\/(\d{1,})/;        
        
        //var store = null;
        self.route();
        
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        //document.addEventListener('deviceready', this.onDeviceReady, false);
        $(window).on('hashchange', $.proxy(this.route, this));
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        //phantomLimb.init({src: 'https://github.com/brian-c/phantom-limb/raw/master/limb-black.png', lefty: false});
    if(nfc) {
        nfc.addNdefListener(function (nfcEvent) {
            scannedNdef(nfcEvent);
        }, function () {
            console.log("Success.  Listening for rings..");
        }, function () {
            alert("NFC Functionality is not working, is NFC enabled on your device?");
        });
    }



    },

    route: function() {
        var page;
        var hash = window.location.hash;
        console.log(hash);
        if (!hash) {
            // Events
            var request = $.ajax({
                type: "GET",
                url: BASE_URL + "events",
                contentType:"application/json",
                dataType: "json",
                data: null,
                success: function(data) {
                    console.log(data.result);
                    if (this.homePage) {
                        //this.slidePage(this.homePage);
                        console.log('');
                    } else {
                        this.homePage = new HomeView(data.result).render();
                        //this.slidePage(this.homePage);
                    }
                    page = this.homePage.el;
                    slider.slidePage($(page));  
                    //$('body').html(page);     
                },
                error: function(error) {
                    console.log("---events", error);
                }
            });

            return;
        }
        var match = hash.match(app.familyURL);
        if (match) {
            //this.store.findById(Number(match[1]), function(employee) {
            var eventId = Number(match[1]);
            var e = {};
            e.name = ''
            e.tagNumber = '';
            
            this.familyPage = new FamilyView(e).render();
            //$('body').html(this.employeePage.el);
            page = this.familyPage.el;
            //$('body').html(page); 
            //slider.slidePageFrom($(page), "right");
            slider.slidePage($(page));
            //$('#container').html(page);
            //this.slidePage(this.employeePage);
            //});
        }
    }
};


function scannedNdef(nfcEvent) { // On NFC Activity..
    alert("scannedNdef: " + JSON.stringify(nfcEvent));

}
