var RegisterView = function(data) {
 
    this.initialize = function() {
        this.el = $('<div/>');
    };
 
    this.initialize();
 
    this.render = function() {
        console.log(JSON.stringify(data));
    
        this.el.html(RegisterView.template(data));
        return this;
    };

};
 
RegisterView.template = Handlebars.compile($("#register-tpl").html());

