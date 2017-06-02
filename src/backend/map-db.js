const crypto = require('crypto');

function md5(txt) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(txt);
    return md5sum.digest('hex');
}


module.exports = function (database,socket,sockets,session,mailer) {
    var examination=database.t('examination'); 
    var question=database.t('question');
    var remedy=database.t('remedy');
    var patient=database.t('patient');
    
    var examination_id=0;
    
    var time_delta=0;
    
    const common = require('./common.js')(database);
    
    const time = function(t) {
        time_delta=Math.round((t-(new Date).getTime())/1800000)*1800000;
    };
    
    var passwords={};
  
    var genPass = function() {
        var hash=md5(Math.random()+'_'+Date.now());
        passwords[hash]=Date.now();
        setTimeout(function(){
            if (typeof(passwords[hash])!='undefined') {
                delete(passwords[hash]);
            }
        },10000);
        return hash;
    }
  
    
    var wall = function (w) {
        var id;
        for (var x in sockets) {
            if (sockets[x].socket==socket) id=sockets[x].examination;
        }
        
        for (var x in sockets) {
            if (sockets[x].socket==socket) continue;
            if (typeof(sockets[x].examination)=='undefined' || sockets[x].examination!=id) continue;
        
            sockets[x].socket.emit('wall',w);
        }    
    }
    
    var examination_map=function(id) {

        if (session.user==null || session.user.id==null) return;
        
        examination_id=id;
        for (var x in sockets) {
            if (sockets[x].socket==socket) sockets[x].examination=examination_id;
        }
        
        var examination_map_counter=0;
        var result={examination:null,questions:[],remedies:[],patient:null};
        
        const get_questions=function(parent,questions) {
            
            examination_map_counter++;
            question.select([{examination: id, parent:parent}],null,function(data){
                
                for (var i=0; i<data.recordsTotal; i++) {
                    data.data[i].date-=time_delta;
                    questions.push(data.data[i]);
                    data.data[i].questions=[];
                    get_questions(data.data[i].id, data.data[i].questions);
                    
                }
                examination_map_counter--;
            });
            
        }
        
        const get_remedies=function(remedies) {
            
            examination_map_counter++;
            remedy.select([{examination: id}],null,function(data){
                for (var i=0; i<data.recordsTotal; i++) {
                    data.data[i].date-=time_delta;
                    remedies.push(data.data[i]);
                }
                examination_map_counter--;
            });
            
        }
        
        examination_map_counter++;
        examination.init(function(){
            question.init(function(){
                remedy.init(function(){
                    patient.init(function(){
                        get_questions(null,result.questions);
                        get_remedies(result.remedies);
                        
                        examination.get(id,function(data){
                            if (data) {
                                common.checkRights(session.user.id,data.patient,function(pa){
                                    if (pa) {
                                        patient.get(data.patient,function(p) {
                                            data.date-=time_delta;
                                            result.examination=data;
                                            result.patient=p;
                                            examination_map_counter--;
                                        });
                                        // empty update to touch update date:
                                        database.t('patient_access').set({patient:pa.patient},pa.id);

                                    } else {
                                        examination_map_counter--;
                                    }
                                    
                                    
                                });
    
                            } 
                        });
                    });
                });
            });
        });
        
        var ret=function() {
            if (examination_map_counter>0) {
                setTimeout(ret,50);
            } else {
                if (result.examination==null) {
                    result.remiedies=[];
                    result.questions=[];
                }
                socket.emit('examination',result);
            }
        };
        
        ret();
    };
    
    
    var node = function(node,obj) {
        
        if (node==null) return;
        if (node[0]!=examination_id) return;
        
        database.t(node[1]).init(function(){
            
            if (node[2]==0) { // new record
                if (obj==null) obj={};
                if (node[1]!='examination') obj.examination=examination_id;
                if (typeof(obj.date)=='undefined') obj.date=Date.now();
                database.t(node[1]).add(obj,function(d){
                     socket.emit('newnode',d);
                     socket.emit('pass',genPass());
                });
                
            } else {
            
                if (obj==null) { //remove
                    database.t(node[1]).remove(node[2]);
                } else {
                    if (typeof(obj.date)!='undefined') obj.date+=time_delta;
                    database.t(node[1]).set(obj,node[2]);
                }
                socket.emit('pass',genPass());
            }
            
        });
        
        

    }
    
    var echo = function(pass,w) {
        if (typeof(passwords[pass])=='undefined') return;
        if (Date.now() - passwords[pass]>5000) {
            delete(passwords[pass]);
            return;
        }
        setTimeout(function(){
            if (typeof(passwords[pass])=='undefined') return;
            delete(passwords[pass]);
        },2000);
       
        wall(w);
    }
    
    socket.on('examination',examination_map);
    socket.on('time',time);
    socket.on('node',node);
    socket.on('wall',echo);
}