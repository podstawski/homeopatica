
module.exports = function (database,socket,sockets,session,mailer) {
    var users=database.t('users'),
        patient=database.t('patient'),
        patient_access=database.t('patient_access'),
        invitations=database.t('invitations');
        
    const common = require('./common.js')(database);
    
    if (session.user==null || session.user.id==null) return;
    
    const patients = function() {
        patient_access.init(function(){
            patient_access.leftjoin({patient:'patient'},[{'patient_access.users':session.user.id}],['patient_access._updated DESC'],function(data){
                socket.emit('patients',data);
            });
        });

    };
    
    const addPatient = function() {
     
        patient.add({users:session.user.id},function(p){
         
            patient.set({hash:common.md5(p.id+'')},p.id,function(p){
                patient_access.add({
                    users:session.user.id,
                    patient:p.id,
                    notifications:1,
                    acl_write:1
                },function(pa){
                    
                    socket.emit('add-patient',p);
                });
            });
        });
    };
    
    const patientSet = function (id,data) {
        id=parseInt(id);
        
        patient.get(id,function(p){
            if (!p || p.users!=session.user.id) {
                socket.emit('patient',id,null);
                return;
            }
            patient.set(data,id,function(p){
            });
        });
    };
    
    const patientAccessSet = function (p,data) {
        //console.log(p,data);
        patient_access.select([{patient:p,users:session.user.id}],null,function(pa){
            if (pa.data.length==0) return;
    
            patient_access.set(data,pa.data[0].id,function(pa){
            });
        });
    };
    
    const addExamination = function (patient_id) {
        patient_id=parseInt(patient_id);
        common.checkRights(session.user.id,patient_id,true,function(pa){
            if (!pa) {
                socket.emit('add-examination');
            } else {
                const examination=database.t('examination');
                examination.init(function(){
                    examination.add({
                        users:session.user.id,
                        date: Date.now(),
                        patient: patient_id
                    },function(exam) {
                        socket.emit('add-examination',exam);
                    });
                });
            }
        }); 
   
    };
    
    const examinations = function(patient_id) {
        patient_id=parseInt(patient_id);
        common.checkRights(session.user.id,patient_id,false,function(pa){
            if (!pa) {
                socket.emit('examinations');
            } else {
                const examination=database.t('examination');
                examination.init(function(){
                    examination.select([{
                        patient: patient_id
                    }],['date DESC'],function(exams) {
                        socket.emit('examinations',exams);
                    });
                });
            }
        }); 
        
    };
    
    const share2email = function (p,e,lang) {
        users.select([{email:e}],null,function(data) {
            if (data.data.length==0) {
                invitations.init(function(){
                    invitations.add({
                        email:e,
                        patient:p.id
                    });
                });
            } else {
                patient_access.select([{users:data.data[0].id, patient:p.id}],null,function(pa){
                    if (pa.data.length==0) {
                        patient_access.add({
                            users:data.data[0].id,
                            patient:p.id,
                            notifications:1
                        });
                    }
                });
            }
            
            mailer.send('share',{
                me: session.user,
                email: e,
                patient: p 
            },lang);
        }); 
    }
    
    const share=function(patient_id,email,lang) {
        email=email.replace(/[ ;]/g,',');
        var emails=email.split(',');
        
        patient.get(patient_id,function(p){
            if (!p) return;
            
            common.checkRights(session.user.id,patient_id,true,function(pa){
                if (pa==null) {
                    socket.emit('share',null,p);
                    return;
                }
                
                var count=0;
                for (var i=0; i<emails.length; i++) {
                    var e=common.email_std(emails[i]);
                    if (e.length==0) continue;
                    share2email(p,e,lang);
                    count++;
                }
    
                socket.emit('share',count,p);
            });
            

        });
        
        
    };
    
    const shares=function(patient_id) {
        common.checkRights(session.user.id,patient_id,true,function(pa){
            if (pa==null) {
                socket.emit('shares',null);
                return;
            }
            
            patient_access.leftjoin({users:'users'},[{'patient_access.patient':patient_id,'patient_access.users':['<>',session.user.id]}],null,function(pa){
                socket.emit('shares',pa.data); 
            });
            
            
        });
    };
    
    
    const writeToggle=function(patient_id,who,mayWrite) {
        common.checkRights(session.user.id,patient_id,true,function(pa){
            if (pa==null) {
                return;
            }
            
            common.checkRights(who,patient_id,false,function(pa){
                if (pa==null) {
                    return;
                }
                patient_access.set({
                    acl_write: mayWrite?1:null
                },pa.id,function(pa){
                });
                
            });
        });
       
    };
    
    const unshare=function(patient_id,who) {
        common.checkRights(session.user.id,patient_id,true,function(pa){
            if (pa==null) {
                return;
            }
            
            common.checkRights(who,patient_id,false,function(pa){
                if (pa==null) {
                    return;
                }
                patient_access.remove(pa.id,function(){
                });
                
            });
        });
        
    }
 
    if (socket) {
        socket.on('add-patient',addPatient);
        socket.on('patients',patients);
        socket.on('patient',patientSet);
        socket.on('patient_access',patientAccessSet);
        socket.on('add-examination',addExamination);
        socket.on('examinations',examinations);
        socket.on('share',share);
        socket.on('shares',shares);
        socket.on('write',writeToggle);
        socket.on('unshare',unshare);
    }
}