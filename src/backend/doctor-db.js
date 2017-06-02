const crypto = require('crypto');


function md5(txt) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(txt);
    return md5sum.digest('hex');
}


module.exports = function (database,socket,sockets,session,mailer) {
    var users=database.t('users'),
        patient=database.t('patient'),
        patient_access=database.t('patient_access');
    const common = require('./common.js')(database);
    
    if (session.user==null || session.user.id==null) return;
    
    
    const patients = function() {
        patient_access.init(function(){
            patient_access.leftjoin({patient:'patient'},[{'patient_access.users':session.user.id}],['patient._updated DESC'],function(data){
                socket.emit('patients',data);
            });
        });

    };
    
    const addPatient = function() {
        patient.add({users:session.user.id},function(p){
            patient.set({hash:md5(p.id+'')},p.id,function(p){
                patient_access.add({
                    users:session.user.id,
                    patient:p.id,
                    notifications:1
                },function(pa){
                    socket.emit('add-patient',p);
                });
            });
        });
    };
    
    const patientSet = function (id,data) {
        id=parseInt(id);
        patient.get(id,function(p){
            if (!p || p.users!=session.user.id) return;
            patient.set(data,id,function(p){
            });
        });
    };
    
    const addExamination = function (patient_id) {
        patient_id=parseInt(patient_id);
        common.checkRights(session.user.id,patient_id,function(pa){
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
        common.checkRights(session.user.id,patient_id,function(pa){
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
 
    if (socket) {
        socket.on('add-patient',addPatient);
        socket.on('patients',patients);
        socket.on('patient',patientSet);
        socket.on('add-examination',addExamination);
        socket.on('examinations',examinations);
    }
}