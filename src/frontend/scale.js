module.exports = function(mapModel, selector) {
    const $ = require('jquery');
    
    if (typeof(selector)=='undefined') selector='body';
    
    $(selector).bind('mousewheel', function(e){

        if(e.originalEvent.wheelDelta /120 > 0) mapModel.scaleUp();
        else mapModel.scaleDown();

    }).bind('DOMMouseScroll',function(e) {
        if (e.detail<0) mapModel.scaleUp();
        if (e.detail>0) mapModel.scaleDown();

    });
}