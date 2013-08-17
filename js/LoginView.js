var LoginView = function(data) {
 
    this.initialize = function() {
        this.el = $('<div/>');
    };
 
    this.initialize();
 
    this.render = function() {
        this.el.html(LoginView.template(data));
        return this;
    };

};
 
LoginView.template = Handlebars.compile($("#login-tpl").html());

