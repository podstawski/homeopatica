const storage_name = 'homeopathy';
const $ = require('jquery');

module.exports = {
    
    lang: function() {
        return navigator.language || navigator.userLanguage;
    },
    
    storage: function(myStorage) {
        
        if (myStorage!=null) {
            window.localStorage.setItem(storage_name,JSON.stringify(myStorage));
            return myStorage;
        }
        
        if (typeof(Storage) != "undefined") {
            if (typeof(window.localStorage[storage_name])=='undefined') window.localStorage.setItem(storage_name,'{}');
            return JSON.parse(window.localStorage[storage_name]);
        }
        return null;
    },
        
    age: function(yob,mob,now) {
        if (now==null) now=Date.now();
        var age_ms=now - new Date(yob,mob,5);
        var age_m=Math.floor(age_ms/(1000*3600*24*(365/12)));
        var result;
        if (age_m>24) {
            result=Math.floor(age_m/12);
        } else {
            result=age_m+'m';
        }
        return result;
    },
    
    gender: function(gender,age) {
        ageStr=age+'';

        if (ageStr.indexOf('m')>0 || age<16) {
            if (gender=='M') return $.translate('MaleK');
            if (gender=='F') return $.translate('FemaleK');
        } else {
            if (gender=='M') return $.translate('Male');
            if (gender=='F') return $.translate('Female');                
        }
        
        return '';
    }
        
}