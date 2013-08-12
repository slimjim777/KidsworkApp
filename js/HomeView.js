var HomeView = function(data) {
 
    this.initialize = function() {
        this.el = $('<div/>');
    };
 
    this.initialize();
 
    this.render = function() {
        this.el.html(HomeView.template(data));
        return this;
    };

};
 
HomeView.template = Handlebars.compile($("#home-tpl").html());

