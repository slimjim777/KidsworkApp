var OverviewView = function(data) {
 
    this.initialize = function() {
        this.el = $('<div/>');
    };
 
    this.initialize();
 
    this.render = function() {
        this.el.html(OverviewView.template(data));
        return this;
    };

};
 
OverviewView.template = Handlebars.compile($("#overview-tpl").html());

