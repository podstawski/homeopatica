const express = require('express');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const http = require('http');
const fs = require('fs');
const path = require('path');
const Map = require('./map-db.js');
const Auth = require('./auth.js');
const crypto = require('crypto');

function parseCookies (rc) {
    var list = {};
    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
}

function md5(txt) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(txt);
    return md5sum.digest('hex');
}


var Server = function(options,database,mailer,logger) {
    var self=this;
    var app = express();
    var httpClients=[];
    var session={};
    if (logger==null) logger=console;
    var map;
  

    app.use(express.static(options.public_path));
    
    
    var initSession = function(cookies,setcookie) {
  
        if (typeof(cookies.sessid)!='undefined') {
            var hash=cookies.sessid;
        } else {
            var hash=md5(Math.random()+'_'+Date.now());
            setcookie(hash);
        }
        
        if (typeof(session[hash])=='undefined') {
            session[hash]={};
        }
        session[hash].hb=Date.now();
        return hash;
    }
    
    var get=function (request, response) {

        var su=request.url.match(/\/signupcode\/([0-9a-f]+)-([0-9]+)/);
        if (su!=null) {
            var cookies=parseCookies(request.headers.cookie);
            var hash=initSession(cookies,function(hash){
                response.cookie('sessid',hash,{path:'/'});
            });           
            new Auth(database,null,null,session[hash],mailer).signupcode(parseInt(su[2]),su[1],response,function(){
                response.end();
            });
            return;
        }
    
    
        var getContents = function(url) {
            url=path.dirname(url);
            
            fs.readFile(url+'/index.html',function(err,data){
                if (err) {
                    getContents(url);
                } else {
                    response.write(data, "utf8");
                    response.end();
                }
            });
        }
        
        getContents(__dirname+'/../../public'+request.url);
    };
    app.get('/*',get);
    
    
    
    var httpServer=app.listen(options.port, function () {
        logger.log('Application listening on port '+options.port)
    });

    var io=require('socket.io').listen(httpServer);
    httpServer.on('error',function(e){
        logger.log('Can not listen on port '+options.port,e);
    });
    
    

    var connection = function(httpSocket) {
        var cookies=parseCookies(httpSocket.handshake.headers.cookie);
        
        var hash=initSession(cookies,function(hash){
            httpSocket.emit('cookie','sessid',hash);
        });
        
        session[hash].socket=httpSocket;

        httpClients.push({socket:httpSocket,session:session[hash]});
        
        var disconnect = function() {
            for (var x in httpClients) {
                if (httpClients[x].socket==httpSocket) {
                   httpClients[x].session.socket=null;
                   httpClients.splice(x,1);
                   break;
                }
            }  
        };
        logger.log('Ooooh we have a guest ;)');
        var map = new Map(database,httpSocket,httpClients,session[hash],mailer);
        var auth = new Auth(database,httpSocket,httpClients,session[hash],mailer);
        httpSocket.on('disconnect',disconnect);
    };
    
    io.sockets.on('connection', connection);

    return {
        'on': function (e,cb) {
            self.on(e,cb);
        }
    }
}

util.inherits(Server, EventEmitter);
module.exports = Server;