const   content = require('mindmup-mapjs-model').content,
        moment = require('moment');



module.exports = function (mapModel,socket,eid) {
    
    if (eid==0) return;
    var nodes={},
        locks={},
        walls=[],
        newnodes={},
        globalLock=true,
        callbacks=[];
 
    var self=this;
    
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
          
        var node_counter = 0;
        
        const join_ideas = function (src,dst,table,sub,notitlefun) {
            if (src.length==0) return;
            if (typeof(dst.ideas)=='undefined') dst.ideas={};
            
            for (var i=0; i<src.length; i++) {
                node_counter++;
                nodes[node_counter]=[eid,table,src[i].id];
                var title=src[i].title!=null?src[i].title:notitlefun(src[i]);

                dst.ideas[node_counter]={id:node_counter,title:title};
                if (src[i].attr!=null) dst.ideas[node_counter].attr=src[i].attr;
                    
                if (sub && typeof(src[i][sub])!='undefined')
                    join_ideas(src[i][sub],dst.ideas[node_counter],table,sub,notitlefun);
            }
        }
        
        join_ideas([examination.examination],map,'examination',null,function(r){
            return moment(r.date).format('DD-MM-YYYY');
        });
        
        
        join_ideas(examination.remedies,map,'remedy',null,function(r){
            return '???';
        });
        
        
        join_ideas(examination.questions,map.ideas[1],'question','questions',function(r){
            return '???';
        });
        
     
     
        mapModel.setIdea(content(map));
        globalLock=false;
    });
    
  
    socket.on('wall',function(w){
        
        var idx=nodeIdx(w[2][0]);
        if (idx==-1) return;
        w[2][0]=idx;


        if (typeof(self[w[1]])=='function') {
            locks[w[0]]=idx;
            self[w[1]].apply(self[w[1]],w[2]);
            locks[w[0]]=0;
        } else if (typeof(mapModel[w[1]])=='function') {
            locks[w[0]]=idx;
            mapModel[w[1]].apply(mapModel[w[1]],w[2]);
            locks[w[0]]=0;
        }
        

        
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
    
    const createNode = function (node_id,table,params) {
        if (typeof(newnodes[node_id])=='undefined') return;
        
        if (params==null) params={};
        if (typeof(newnodes[node_id].title)!='undefined') {
            params.title=newnodes[node_id].title;
        }
        if (typeof(newnodes[node_id].attr)!='undefined') {
            params.attr=newnodes[node_id].attr;
        }
        delete(newnodes[node_id]);
        socket.emit('node',[eid,table,0],params);
        socket.once('newnode',function(id){
            nodes[node_id]=[eid,table,id];
        });        
    }
    
    const callback = function () {
        if (callbacks.length==0) return;
        var f=callbacks[0];
        callbacks.shift();
        f();
        callback();
    }
    
    mapModel.addEventListener('layoutChangeComplete', callback);
    
    mapModel.addEventListener('nodeAttrChanged', function(node){
        if (globalLock) return;
        if (typeof(nodes[node.id])=='undefined') return;
        socket.emit('node',nodes[node.id],{attr:node.attr});
    });
    mapModel.addEventListener('nodeTitleChanged', function(node){
        if (globalLock) return;
        if (typeof(nodes[node.id])=='undefined') return;
        if (!lockWall('nodeTitleChanged','updateTitle',node.id,[nodes[node.id],node.title,false])) return;
        socket.emit('node',nodes[node.id],{title:node.title});
    });

    mapModel.addEventListener('nodeCreated', function(node){
        if (globalLock) return;
        
        newnodes[node.id]=node;
        
        callbacks.push(function(){ //if it is new root, there will be no connector
            var params=null;
            if (node.title!=null) {
                params={title:node.title};
            }
            createNode(node.id,'remedy',params);
        });
        
    });
    
    
    mapModel.addEventListener('connectorCreated', function(fromto) {
        if (globalLock) return;
        
        if (typeof(nodes[fromto.to])=='undefined') { //new node
            var params=null;
            
            if (fromto.from==1) createNode(fromto.to,'question',null);
            else {
                var parent=nodes[fromto.from];
                if (parent[1]=='question') {
                    createNode(fromto.to,'question',{parent:parent[2]});
                }
            }
            
        } else { //existing node
            if (nodes[fromto.to][1]=='remedy' || nodes[fromto.from][1]=='remedy') {
                callbacks.push(function(){
                    mapModel.undo('remedy');
                });
            } else {
                var from=nodes[fromto.from];
                socket.emit('node',nodes[fromto.to],{parent:fromto.from==1?null:from[2]});
            }
            
            
        }
         
    });
    
    self.removeNode = function(node_id) {
        let currentNode = mapModel.getCurrentlySelectedIdeaId();
        mapModel.selectNode(node_id,true);
        mapModel.removeSubIdea('wall');
        delete(nodes[node_id]);
        if (currentNode!=node_id) mapModel.selectNode(currentNode,true);
    }
    
    var nodeRemoved = function(node){
        
        if (globalLock) return;
        if (typeof(nodes[node.id])=='undefined') return;
        
        if (node.id==1) {
            globalLock=true;
            callbacks.push(function() {
                mapModel.undo('root no');
                console.log('undo remove done',globalLock);
                globalLock=false;
                
            });
            return;
        }
        
        if (!lockWall('nodeRemoved','removeNode',node.id,[nodes[node.id]])) return;
        socket.emit('node',nodes[node.id],null);
        delete(nodes[node.id]);
    };
    
    mapModel.addEventListener('nodeRemoved', nodeRemoved);
    
}