const crypto = require('crypto');

function md5(txt) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(txt);
    return md5sum.digest('hex');
}


module.exports = function (database,socket,sockets,session) {
    var examination=database.t('examination');
    var question=database.t('question');
    var remedy=database.t('remedy');
    
    var time_delta=0;
    
    var time = function(t) {
        time_delta=t-(new Date).getTime();
    };
    
    var passwords={};
  
    var genPass = function() {
        var hash=md5(Math.random()+'_'+Date.now());
        passwords[hash]=Date.now();
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

        for (var x in sockets) {
            if (sockets[x].socket==socket) sockets[x].examination=id;
        }
        
        var examination_map_counter=0;
        var result={examination:{},questions:[],remedies:[]};
        
        examination_map_counter++;
        examination.init(function(){
            examination.get(id,function(data){
                if (data) {
                    data.date-=time_delta;
                    result.examination=data;
                    examination_map_counter--;
                } else {
                    examination.add({id:id, 'date': (new Date).getTime()},function(data){
                        data.date-=time_delta;
                        result.examination=data;
                        examination_map_counter--;
                    });
                }
            });
        });
        
        var ret=function() {
            if (examination_map_counter>0) {
                setTimeout(ret,50);
            } else {
                socket.emit('examination',result);
            }
        };
        
        ret();
    };
    
    
    var node = function(node,obj) {
        if (node[1]=='examination') {
            examination.set(obj,node[2]);
            socket.emit('pass',genPass());
        }
    }
    
    var echo = function(pass,w) {
        if (typeof(passwords[pass])=='undefined') return;
        if (Date.now() - passwords[pass]>5000) return;
        delete(passwords[pass]);
        wall(w);
    }
    
    socket.on('examination',examination_map);
    socket.on('time',time);
    socket.on('node',node);
    socket.on('wall',echo);
}