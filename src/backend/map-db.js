
module.exports = function (database,socket) {
    var examination=database.t('examination');
    var question=database.t('question');
    var remedy=database.t('remedy');
    
    var time_delta=0;
    
    var time = function(t) {
        time_delta=t-(new Date).getTime();
    };
    
    var examination_map=function(id) {

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
        console.log(node,obj);
        
        if (node[1]=='examination') examination.set(obj,node[2]);
    }
    
    socket.on('examination',examination_map);
    socket.on('time',time);
    socket.on('node',node);
}