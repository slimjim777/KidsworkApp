var RegisterView = function(data) {
 
    this.initialize = function() {
        this.el = $('<div/>');
    };
 
    this.initialize();
 
    this.render = function() {
        this.el.html(RegisterView.template(data));
        return this;
    };

};
 
RegisterView.template = Handlebars.compile($("#register-tpl").html());

