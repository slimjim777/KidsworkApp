var FamilyView = function(family) {
 
    this.initialize = function() {
        this.el = $('<div/>');
    };
 
    this.initialize();
 
    this.render = function() {
        console.log(JSON.stringify(family));
    
        this.el.html(FamilyView.template(family));
        return this;
    };

};
 
FamilyView.template = Handlebars.compile($("#family-tpl").html());

