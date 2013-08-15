var ScanTagView = function(data) {
 
    this.initialize = function() {
        this.el = $('<div/>');
    };
 
    this.initialize();
 
    this.render = function() {
        this.el.html(ScanTagView.template(data));
        return this;
    };

};
 
ScanTagView.template = Handlebars.compile($("#scan-tpl").html());
