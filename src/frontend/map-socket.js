const   content = require('mindmup-mapjs-model').content,
        moment = require('moment');

module.exports = function (mapModel,socket,eid) {
    
    if (eid==0) return;
    var nodes=[],
        locks={},
        walls=[];
    
    
    var nodeIdx=function(v) {

        for (var x in nodes) {
            if (JSON.stringify(nodes[x])==JSON.stringify(v)) {
                return parseInt(x);
            }
        }        
        return -1;
    }
    
    socket.emit('examination',eid);
    
    socket.on('examination',function(examination) {
        
        var map={id: 'root', formatVersion: 3, ideas: {}};
        
        var title=examination.examination.title!=null?examination.examination.title:moment(examination.examination.date).format('DD-MM-YYYY');
        
        nodes[1]=[eid,'examination',examination.examination.id];
        map.ideas[1]={id:1,title:title};
        
        if (examination.examination.attr!=null) map.ideas[1].attr=examination.examination.attr;
               
        mapModel.setIdea(content(map));
    });
    
  
    socket.on('wall',function(w){
        
        var idx=nodeIdx(w[2][0]);
        if (idx==-1) return;
        w[2][0]=idx;
        
        if (typeof(mapModel[w[1]])!='function') return;
        locks[w[0]]=idx;
        mapModel[w[1]].apply(mapModel[w[1]],w[2]);
        locks[w[0]]=0;

        
    });
    
    
    var wall = function(pass) {
        if (walls.length==0) return;
        socket.emit('wall',pass,walls[0]);
        walls.shift();
        wall(pass);
    }
    
    socket.on('pass',wall);
    
    const lockWall=function(lockName,wallName,id,params) {
        console.log(locks);
        if (typeof(locks[lockName])!='undefined' && locks[lockName]==id) return false;
        walls.push([lockName,wallName,params]);
        return true;
    }
    
    mapModel.addEventListener('nodeAttrChanged', function(node){
        
        socket.emit('node',nodes[node.id],{attr:node.attr});
    });
    mapModel.addEventListener('nodeTitleChanged', function(node){
 
        if (!lockWall('nodeTitleChanged','updateTitle',node.id,[nodes[node.id],node.title,false])) return;
        
        socket.emit('node',nodes[node.id],{title:node.title});
    });
}