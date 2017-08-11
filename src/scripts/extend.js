(function($doc) {
    
    jQuery && jQuery.fn.extend({
        toggleAttr:function(attrName){
            typeof attrName === "string" && this.toArray().forEach(function(el){
                var attrValue = el.getAttribute(attrName);
                if(typeof attrValue === "string"){
                    el.removeAttribute(attrName);
                } else {
                    el.setAttribute(attrName,"");
                }
            });
            return this;
        }
    });
    
}());
