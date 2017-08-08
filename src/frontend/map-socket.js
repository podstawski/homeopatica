const   content = require('mindmup-mapjs-model').content,
        jQuery = require('jquery'),
        moment = require('moment'),
        toastr = require('toastr'),
        common = require('./common.js'),
        flatpickr = require("flatpickr");

var flatpickr_locales={};

const flatpickr_req= require.context("flatpickr/dist/l10n",true,/^.*\.js$/);
flatpickr_req.keys().forEach(function(key){
    flatpickr_locales[key.substr(2,2)] = flatpickr_req(key);
});

require("../../node_modules/flatpickr/dist/flatpickr.min.css");
//require("./node_modules/flatpickr/dist/flatpickr.dark.min.css");

module.exports = function (mapModel,socket,eid,container,menuContainer) {
    
    if (eid==0) return;
    var nodes={},
        nodes_full={},
        locks={},
        walls=[],
        newnodes={},
        globalLock=true,
        callbacks=[];
    var node_counter = 0,
        last_created_node,
        last_question=0,
        menu_datetime,
        menu_node,
        last_xy=[0,0];
    var self=this;
    var language = common.lang();
    var $=jQuery;
    var myStorage = common.storage();
    
    
    moment.locale(language);
    
    var flatpickr_opt={
        enableTime: true,
        time_24hr: true,
        onChange: function(selectedDates, dateStr, instance) {
            menu_datetime=selectedDates;
        }
    };
    if (typeof(flatpickr_locales[language])!='undefined') {
        flatpickr_opt.locale=flatpickr_locales[language][language];
    }
    
    var datepicker=new flatpickr(document.getElementById('context-menu-date'),flatpickr_opt);
    
    datepicker.setDate('2017-05-05');
    
    const nodeIdx=function(v) {

        for (var x in nodes) {
            if (JSON.stringify(nodes[x])==JSON.stringify(v)) {
                return parseInt(x);
            }
        }        
        return -1;
    }
    
    const pill_icon = function() {
        return {url:'/css/pills-bw.svg',width:20, height:20, position:'left'};
    }
    
    
    socket.emit('examination',eid);
    
    socket.on('examination',function(examination) {
        
        var map={id: 'root', formatVersion: 3, ideas: {}, links:[]};
        
        console.log(examination);
          
        const join_ideas = function (src,dst,table,sub,notitlefun,everyrecfun) {
            if (src.length==0) return;
            if (typeof(dst.ideas)=='undefined') dst.ideas={};
            
            for (var i=0; i<src.length; i++) {
                node_counter++;
                nodes[node_counter]=[eid,table,src[i].id];
                if (everyrecfun) everyrecfun(src[i],node_counter,table);
                nodes_full[node_counter] = {t:table,d:src[i]};
                var title=src[i].title!=null?src[i].title:notitlefun(src[i]);

                dst.ideas[node_counter]={id:node_counter,title:title};
                if (src[i].attr!=null) dst.ideas[node_counter].attr=src[i].attr;
                    
                if (sub && typeof(src[i][sub])!='undefined')
                    join_ideas(src[i][sub],dst.ideas[node_counter],table,sub,notitlefun,everyrecfun);
            }
        }
        
        join_ideas([examination.examination],map,'examination',null,function(r){
            return moment(r.date).format('DD MMM YYYY');
        });
        
        
        join_ideas(examination.remedies,map,'remedy',null,function(r){
            return '???';
        },function(r,node_id,table){
            if (r.attr==null) r.attr={};
            r.attr.icon=pill_icon();
        });
        
        
        join_ideas(examination.questions,map.ideas[1],'question','questions',function(r){
            return '???';
        },function(r,node_id,table){
            if (r.remedy==null) return;
            map.links.push({ideaIdFrom: node_id, ideaIdTo:nodeIdx([eid,'remedy',r.remedy])});
        });
        
        
        var p_name=typeof(myStorage[examination.patient.hash])!='undefined'?myStorage[examination.patient.hash].name:examination.patient.name;
        $('.doctor-panel .patient_name').text(p_name);
        if (examination.patient.yob && examination.patient.mob) {
            
            var age=common.age(examination.patient.yob,examination.patient.mob,examination.examination.date);       
            $('.doctor-panel .patient_age').text(common.gender(examination.patient.gender,age) + ' ' + age).fadeIn(3000);
        }
        
        container.removeClass('loader');
        //console.log(map);return;
        mapModel.setIdea(content(map));
        globalLock=false;
        
        
        socket.emit('examinations',examination.patient.id);
    });
    
    socket.on('examinations',function(examinations) {
        if(examinations.recordsTotal==0) return;
        var html='<ul>';
        
        for (var i=0;i<examinations.data.length; i++) {
            if (examinations.data[i].id==eid) continue;
            html+='<li><a href="/map/'+examinations.data[i].id+'">';
            html+=examinations.data[i].title;
            html+=' ('+moment(examinations.data[i].date).format('DD MMM YYYY')+')';
            html+='</a></li>';
        }
        html+='</ul>';
        $('.doctor-panel .patient_history').html(html);
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
    
    
    self.nodeCreate = function(x,table,params,data) {   
        let currentNode = mapModel.getSelectedNodeId();
     
        if (table=='remedy') {
            
            mapModel.insertRoot('socket',params.title?params.title:null);
            nodes[last_created_node]=[eid,table,data.id];
            nodes_full[last_created_node]={t:table,d:data};
            
        }
        if (table=='question') {
            var parentId=1;
            if (params.parent!=null) {
                parentId=Math.abs(nodeIdx([eid,table,params.parent]));
            }
            mapModel.addSubIdea('socket',parentId,params.title?params.title:null);
            nodes[last_created_node]=[eid,table,data.id];
            nodes_full[last_created_node]={t:table,d:data};
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
        if (!lockWall('createNode','nodeCreate',-1,[[0,table,0],table,params,{}])) return;
        
     
        socket.emit('node',[eid,table,0],params);
        socket.once('newnode',function(data){
            nodes[node_id]=[eid,table,data.id];
            nodes_full[node_id]={t:table,d:data};
            if (table=='remedy') mapModel.getIdea().updateAttr(node_id,'icon',pill_icon());
            for (var i=0; i<walls.length; i++) {
                if (walls[i][0]=='createNode') {
                    walls[i][2][3]=data;
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
        
        if (typeof(node.attr)=='undefined' ) node.attr={};
        
        //bugfix:
        if (node.id!=node.rootId && typeof(node.attr.position)!='undefined') {
            console.log(mapModel.getIdea().getAttrById(node.rootId,'position'));
            node.attr.position[0]=node.x - mapModel.getIdea().getAttrById(node.rootId,'position')[0];
            delete(node.attr.position[2]);
        }
        console.log(node);
    
        
        if (!lockWall('nodeAttrChanged','updateAttr',node.id,[nodes[node.id],node.attr])) return;
 
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
            
            
            if (last_question>0) {
                
                var checkIfTitleEnered = function() {
                    if (typeof(nodes[node.id])=='undefined') return;
                    if(mapModel.getIdea().findSubIdeaById(node.id).title.length==0) {
                        setTimeout(checkIfTitleEnered,200);
                        return;
                    }
                    mapModel.addLink('socket',last_question);
                    var remedy=nodes[node.id];
                    socket.emit('node',nodes[last_question],{remedy:remedy[2]});
                    wallLink(node.id,last_question);
                    last_question=0;
                    
                };
                setTimeout(checkIfTitleEnered,1000);
                
                mapModel.getIdea().updateAttr(node.id,'position',last_xy);

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
                    mapModel.undo('socket');
                    
                    let currentNode = mapModel.getSelectedNodeId();
                    if (nodes[fromto.to][1]=='remedy' && nodes[fromto.from][1]=='question') {
                        mapModel.selectNode(fromto.to,true);
                        mapModel.addLink('socket',fromto.from);
                        var remedy=nodes[fromto.to];
                        socket.emit('node',nodes[fromto.from],{remedy:remedy[2]});
                        wallLink(fromto.from,fromto.to);
                    }
                    if (nodes[fromto.to][1]=='question' && nodes[fromto.from][1]=='remedy') {
                        mapModel.selectNode(fromto.from,true);
                        mapModel.addLink('socket',fromto.to);
                        var remedy=nodes[fromto.from];
                        socket.emit('node',nodes[fromto.to],{remedy:remedy[2]});
                        wallLink(fromto.from,fromto.to);
                    }
                    
                    mapModel.selectNode(currentNode,true);
                    
                });
            } else {
                var from=nodes[fromto.from];
                socket.emit('node',nodes[fromto.to],{parent:fromto.from==1?null:from[2]});
            }
            
            
        }
        
    });
    
    const wallLink = function(from,to) {
        lockWall('linkCreated','linkCreated',from,[nodes[from],nodes[to]]);
       
    };
    
    self.linkCreated = function(node_id,dest) {
        let currentNode = mapModel.getSelectedNodeId();

        mapModel.selectNode(node_id,true);
        dest_id=nodeIdx(dest);
        if (dest_id>0) mapModel.addLink('socket',dest_id);
        
        mapModel.selectNode(currentNode,true);
        
    }
    
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
                mapModel.undo('socket');
                
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
        
        if (typeof(nodes_full[node_id].d.importance)!='undefined') {
            menuContainer.find('.imp:contains('+nodes_full[node_id].d.importance+')').addClass('active');
        }
        if (typeof(nodes_full[node_id].d.potency)!='undefined') {
            menuContainer.find('.pot:contains('+nodes_full[node_id].d.potency+')').addClass('active');
        }
        
        
        
        last_xy=[x-bw/2,y-bh/2,1];
        if (last_xy[0]>0) last_xy[0]+=40;
        else last_xy[0]-=40;
        //console.log(last_xy,x,y,bw,bh);
        
        saveDate(); //if any was changed
        
        datepicker.setDate(nodes_full[node_id].d.date);
        menuContainer.find('input.date').val(moment(nodes_full[node_id].d.date).format('DD MMM YYYY, HH:mm'));
        menuContainer.css({left:dx,top:dy}).fadeIn(900);
        menu_datetime=null;
        menu_node=node_id;

    });
    
    self.updateAttr = function (node_id,attr) {
        
        
        for (var x in attr) {
    
            mapModel.getIdea().updateAttr(node_id,x,attr[x]);
        }
    }
    
    self.dateChanged = function(node_id,date) {
        if (typeof(nodes_full[node_id])=='undefined') return;
        nodes_full[node_id].d.date = date;
    };
    
    const saveDate = function() {
        if (menu_datetime!=null) {
            nodes_full[menu_node].d.date = new Date(menu_datetime[0]).getTime();
            lockWall('dateChanged','dateChanged',menu_node,[nodes[menu_node],nodes_full[menu_node].d.date])
            socket.emit('node',nodes[menu_node],{date:nodes_full[menu_node].d.date});                                
            menu_datetime=null;
        }    
    }
    
    menuContainer.click(function(){
        jQuery(this).fadeOut(300,function(){
            menuContainer.removeClass('examination');
            menuContainer.removeClass('remedy');
            menuContainer.removeClass('question');
            
            menuContainer.find('.active').removeClass('active');
            
            saveDate();
        });
    });
    
    menuContainer.find('input.date').click(function(e){
        e.stopPropagation();
    });
    
    menuContainer.find('.imp,.pot').click(function(){
        var style=mapModel.getIdea().getAttrById(mapModel.getSelectedNodeId(),'style');
        if (!style) style={};
        style.background=jQuery(this).css('background-color');
        mapModel.getIdea().updateAttr(mapModel.getSelectedNodeId(),'style',style);
        
        const attr=jQuery(this).text();
        var val={};
        if (jQuery(this).hasClass('imp')) {
            val.importance=parseInt(attr);
            nodes_full[mapModel.getSelectedNodeId()].d.importance=val.importance;
        }
        if (jQuery(this).hasClass('pot')) {
            val.potency=attr;
            nodes_full[mapModel.getSelectedNodeId()].d.potency=val.potency;
        }
        
        socket.emit('node',nodes[mapModel.getSelectedNodeId()],val);
    });
 
    menuContainer.find('.icon.insertRoot').click(function(e){
        last_question = mapModel.getSelectedNodeId();
    });
    
    var last_ro=0;
    socket.on('ro',function(){
        walls=[];
        if (Date.now()-last_ro<1000) return;
        last_ro=Date.now();
        toastr.error($.translate('You must not change anything'),$.translate('Read only'));
        mapModel.undo('socket');
        
    });
}