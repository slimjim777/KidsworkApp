var WriteTagView = function(data) {
 
    this.initialize = function() {
        this.el = $('<div/>');
    };
 
    this.initialize();
 
    this.render = function() {
        this.el.html(WriteTagView.template(data));
        return this;
    };

};
 
WriteTagView.template = Handlebars.compile($("#write-tpl").html());
