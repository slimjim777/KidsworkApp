var HomeView = function(events) {

    this.findByName = function() {
        var e = {};
        e.id = 1;
        e.name = 'James';
        var employees = [e];
        //$('.employee-list').html(HomeView.liTemplate(employees));
    };
    
    this.initialize = function() {
        // Define a div wrapper for the view. The div wrapper is used to attach events.
        this.el = $('<div/>');
        this.el.on('keyup', '.search-key', this.findByName);
    };
 
    this.initialize(); 

    this.render = function() {
        this.el.html(HomeView.template(events));
        return this;
    };
    

}
 
HomeView.template = Handlebars.compile($("#home-tpl").html());

