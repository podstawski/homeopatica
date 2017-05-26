const crypto = require('crypto');

function md5(txt) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(txt);
    return md5sum.digest('hex');
}

function email_std(e) {
    return e.trim().toLowerCase();
}


module.exports = function (database,socket,sockets,session) {
    var users=database.t('users'); 
   
  
    var genPass = function() {
        var hash=md5(Math.random()+'_'+Date.now());
        return hash;
    }
  
    const signup = function(data) {
        users.count([{email:email_std(data.email)}],function(c){
            if (c>0) {
                socket.emit('signup','email_exists');
                return;
            }
            
            users.add({
                email:email_std(data.email),
                active:0,
                hash:genPass(),
                doctor:data.doctor==1?1:0,
                password: md5(data.password),
                date: Date.now()+3*24*3600*1000},
                
                function (r) {
                    //code
                });
        });
    }
    
    
    
    socket.on('signup',signup);
    
}