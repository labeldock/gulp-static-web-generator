(function($doc) {
    $doc.on("click","#menu-open-action",function(e){
        $("#gnb").toggleAttr("open");
    });
})($(document));
