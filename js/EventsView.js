var EventsView = function(events) {

    this.findByName = function() {
        var e = {};
        e.id = 1;
        e.name = '';
        var employees = [e];
    };
    
    this.initialize = function() {
        // Define a div wrapper for the view. The div wrapper is used to attach events.
        this.el = $('<div/>');
        this.el.on('keyup', '.search-key', this.findByName);
    };
 
    this.initialize(); 

    this.render = function() {
        this.el.html(EventsView.template(events));
        return this;
    };
    

};
 
EventsView.template = Handlebars.compile($("#events-tpl").html());

