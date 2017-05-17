const   content = require('mindmup-mapjs-model').content,
        jQuery = require('jquery'),
        moment = require('moment');



module.exports = function (mapModel,socket,eid,container,menuContainer) {
    
    if (eid==0) return;
    var nodes={},
        locks={},
        walls=[],
        newnodes={},
        globalLock=true,
        callbacks=[];
    var node_counter = 0,
        last_created_node;
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
        
     
        container.removeClass('loader');
        mapModel.setIdea(content(map));
        globalLock=false;
    });
    
  
    socket.on('wall',function(w){
        
        var idx=nodeIdx(w[2][0]);
        //if (idx==-1) return;
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
    
    
    self.nodeCreate = function(x,table,params,id) {   
        let currentNode = mapModel.getSelectedNodeId();
     
        if (table=='remedy') {
            mapModel.insertRoot('socket',params.title?params.title:null);
            nodes[last_created_node]=[eid,table,id];
        }
        if (table=='question') {
            var parentId=1;
            if (params.parent!=null) {
                parentId=Math.abs(nodeIdx([eid,table,params.parent]));
            }
            mapModel.addSubIdea('socket',parentId,params.title?params.title:null);
            nodes[last_created_node]=[eid,table,id];
        }
        
        mapModel.selectNode(currentNode,true);
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
        if (!lockWall('createNode','nodeCreate',-1,[[0,table,0],table,params,0])) return;
        
     
        socket.emit('node',[eid,table,0],params);
        socket.once('newnode',function(id){
            nodes[node_id]=[eid,table,id];
            for (var i=0; i<walls.length; i++) {
                if (walls[i][0]=='createNode') {
                    walls[i][2][3]=id;
                    break;
                }
            }
            
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
        last_created_node=node.id;
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
        let currentNode = mapModel.getSelectedNodeId();
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
    
    mapModel.addEventListener('contextMenuRequested',function(node_id,x,y){
        
        const   bw=jQuery('body').width(),
                bh=jQuery('body').height(),
                cw=menuContainer.width(),
                ch=menuContainer.height();
        var dx,dy;
    
        
        
        if (x>bw/2) dx=x-cw-30;
        else dx=x+30;
        
        dy=y-ch/2;
        if (dy<0) dy=10;
        if (dy+ch+30 > bh) dy=bh-ch-30;
        
        menuContainer.addClass(nodes[node_id][1]);
        
        menuContainer.css({left:dx,top:dy}).fadeIn(900);
    });
    
    menuContainer.click(function(){
        jQuery(this).fadeOut(300,function(){
            menuContainer.removeClass('examination');
            menuContainer.removeClass('remedy');
            menuContainer.removeClass('question');
            
            
        });
    });
    
    menuContainer.find('.imp').click(function(){
        menuContainer.find('.updateStyle').val(jQuery(this).css('background-color'));
    });
    
}