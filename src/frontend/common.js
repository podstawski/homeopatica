const storage_name = 'homeopathy';

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
    }   
        
}