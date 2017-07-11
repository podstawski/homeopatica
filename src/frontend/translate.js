const   dictionary = require('./langs.js'),
        common = require('./common.js');

module.exports = function ( $ ) {    
    var userLang = common.lang();

    $.extend({
        'translate': function (txt,lang) {
            if (lang==null) lang=userLang;
        
            txt=txt.trim();
            if (typeof(dictionary[lang])=='undefined') return txt;
            
            if (typeof(dictionary['en'][txt])=='undefined' && typeof(websocket)!='undefined') {
                websocket.emit('db-save','langs',{label:txt});
            };
            
            if (typeof(dictionary[lang][txt])=='undefined') return txt;
            return dictionary[lang][txt];
        }
    });
    
    $.fn.translate = function () {
        this.each (function() {
        
            var txt=$(this).attr('original-text')||$(this).attr('placeholder')||$(this).attr('title')||$(this).text();
            var trans=$.translate(txt);
    
            if ($(this).is('input')) {
                $(this).attr('placeholder',trans);
            } else if ($(this).attr('title')!==undefined) {
                $(this).attr('title',trans);
            } else {
                $(this).text(trans);
            }
            if (txt!=trans) $(this).attr('original-text',txt);
            
        });
        return this;
    };
};