const  $ = require('jquery');

module.exports = function(socket) {
    var fixed_mode=false;
    
    $('.doctor-panel').mouseenter(function(e){
        
        $(this).addClass('visible');
        
    }).mouseleave(function(e){
        if (fixed_mode) return;
        
        setTimeout(function(){
            $('.doctor-panel').removeClass('visible');
        },300);
        
    });
    
    $('.doctor-panel input').focus(function(e){
        fixed_mode=true;
    }).focusout( function(e){
        fixed_mode=false;
    });
    
    
    $('.doctor-panel .translate').translate();
}