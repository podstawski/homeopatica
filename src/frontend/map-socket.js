const   content = require('mindmup-mapjs-model').content,
        moment = require('moment');

module.exports = function (mapModel,socket,eid) {
    
    if (eid==0) return;
    var nodes={};
    
    socket.emit('examination',eid);
    
    socket.on('examination',function(examination) {
        
        var map={id: 'root', formatVersion: 3, ideas: {}};
        
        var title=examination.examination.title!=null?examination.examination.title:moment(examination.examination.date).format('DD-MM-YYYY');
        
        nodes[1]=[eid,'examination',examination.examination.id];
        map.ideas[1]={id:1,title:title};
        
        if (examination.examination.attr!=null) map.ideas[1].attr=examination.examination.attr;
      
        console.log(map);          
        mapModel.setIdea(content(map));
    });
    
    
    mapModel.addEventListener('nodeAttrChanged', function(node){
        socket.emit('node',nodes[node.id],{attr:node.attr});
    });
    mapModel.addEventListener('nodeTitleChanged', function(node){
        socket.emit('node',nodes[node.id],{title:node.title});
    });
}