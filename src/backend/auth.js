
module.exports = function (database,socket,sockets,session,mailer) {
    var users=database.t('users'),
        invitations=database.t('invitations'),
        patient_access=database.t('patient_access'); 

    const common=require('./common.js')(database);   
  
    var genPass = function() {
        var hash=common.md5(Math.random()+'_'+Date.now());
        return hash;
    }
  
    const signup = function(data,lang) {
        users.count([{email:common.email_std(data.email)}],function(c){
            if (c>0) {
                socket.emit('signup','email_exists');
                return;
            }
            users.add({
                email:common.email_std(data.email),
                active:0,
                hash:genPass(),
                doctor:data.doctor==1?1:0,
                password: common.md5(data.password),
                date: Date.now()+3*24*3600*1000},
                
                function (r) {
                    mailer.send('adduser',r,lang);
                    socket.emit('signup','ok',r);
                    invitations.init(function(){
                        patient_access.init(function(){
                            invitations.select([{email:r.email}],null,function(invitation){
                                for (var i=0; i<invitation.data.length; i++) {
                                    patient_access.add({
                                        users:r.id,
                                        patient:invitation.data[i].patient,
                                        notifications:1
                                    });
                                    
                                    invitations.remove(invitation.data[i].id);
                                    
                                }
                            });
                        });

                    });
                });            

        });
    };
    
    const signin = function(email,pass) {
        
        users.select([{email:common.email_std(email)}],null,function(data){
            if (data.recordsTotal==0 || data.data[0].password!=common.md5(pass.trim())) {
                socket.emit('signin',null);
                return;
            }
            
            if (data.data[0].active!=1) {
                socket.emit('signin',false);
                return;
            }
            session.user=data.data[0];
            
            socket.emit('signin',(data.data[0].doctor==1)?'/doctor/':'/patient/');
        });
    };
    
    const logout = function() {
        session.user=null;  
    };
    
    if (socket) {
        socket.on('signup',signup);
        socket.on('signin',signin);
        socket.on('logout',logout);
    }
    
    
    return {
        'signupcode': function(user_id,hash,response,cb) {
            users.get(user_id,function(user) {
                if(user==null || user.hash!=hash){
                    response.redirect(302, '/');
                    if (cb) cb();
                    return;
                }
                response.redirect(302, (user.doctor==1)?'/doctor/':'/patient/');
                users.set({active:1, hash:null},user_id,function(u){
                    session.user=u;
                    cb();
                });
                
            })
        }
    }
}