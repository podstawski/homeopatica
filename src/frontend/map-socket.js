const   content = require('mindmup-mapjs-model').content,
        moment = require('moment');

module.exports = function (mapModel,socket,eid) {
    
    if (eid==0) return;
    var nodes={},
        locks={},
        walls=[],
        newnodes={};
    
    
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
        
        console.log(examination);
        var map={id: 'root', formatVersion: 3, ideas: {}};
        
        var title=examination.examination.title!=null?examination.examination.title:moment(examination.examination.date).format('DD-MM-YYYY');
        
        var node_counter = 1;
        nodes[node_counter]=[eid,'examination',examination.examination.id];
        map.ideas[node_counter]={id:node_counter,title:title};
        
        if (examination.examination.attr!=null) map.ideas[node_counter].attr=examination.examination.attr;
        
        const join_questions = function (src,dst) {
            if (src.length==0) return;
            
            dst.ideas={};
            for (var i=0; i<src.length; i++) {
                node_counter++;
                nodes[node_counter]=[eid,'question',src[i].id];
                var title=src[i].title!=null?src[i].title:'???';

                dst.ideas[node_counter]={id:node_counter,title:title};
                if (src[i].attr!=null) dst.ideas[node_counter].attr=src[i].attr;
                    
                if (typeof(src[i].questions)!='undefined') join_questions(src[i].questions,dst.ideas[node_counter]);
            }
        }
        
        join_questions(examination.questions,map.ideas[node_counter]);
               
           
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
        if (typeof(locks[lockName])!='undefined' && locks[lockName]==id) return false;
        walls.push([lockName,wallName,params]);
        return true;
    }
    
    const createNode = function (node_id,table,parent) {
        if (typeof(newnodes[node_id])=='undefined') return;
        delete(newnodes[node_id]);
        
        socket.emit('node',[eid,table,0],parent==null?null:{parent:parent});
        socket.once('newnode',function(id){
            nodes[node_id]=[eid,table,id];
        });        
    }
    
    mapModel.addEventListener('nodeAttrChanged', function(node){
        if (typeof(nodes[node.id])=='undefined') return;
        socket.emit('node',nodes[node.id],{attr:node.attr});
    });
    mapModel.addEventListener('nodeTitleChanged', function(node){
        if (typeof(nodes[node.id])=='undefined') return;
        if (!lockWall('nodeTitleChanged','updateTitle',node.id,[nodes[node.id],node.title,false])) return;
        socket.emit('node',nodes[node.id],{title:node.title});
    });

    mapModel.addEventListener('nodeCreated', function(node){
        newnodes[node.id]=node.id;
        
        setTimeout(function(){ //if it is new root, there will be no connector
            if (typeof(newnodes[node.id])=='undefined') return;
            
        },2000);
        
    });
    
    mapModel.addEventListener('connectorCreated', function(fromto) {
        

        if (typeof(nodes[fromto.to])=='undefined') { //new node
            if (fromto.from==1) createNode(fromto.to,'question',null);
            else {
                var parent=nodes[fromto.from];
                if (parent[1]=='question') {
                    createNode(fromto.to,'question',parent[2]);
                }
            }
            
        } else { //existing node
            var from=nodes[fromto.from];
            socket.emit('node',nodes[fromto.to],{parent:fromto.from==1?null:from[2]});
        }
        
        
        
    });
    
}