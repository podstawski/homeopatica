const content = require('mindmup-mapjs-model').content;

module.exports = function (mapModel,socket,eid) {
    
    if (eid==0) return; 
    
    socket.emit('examination',eid);
    
    socket.on('examination',function(examination) {
        
        var map={id: 'root', formatVersion: 3, ideas: {}};
        
        console.log(examination);
        
        map.ideas[1]={id:1,title:new Date(examination.examination.date)+''};
                
        mapModel.setIdea(content(map));
    });
}