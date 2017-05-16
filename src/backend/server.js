const express = require('express');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const http = require('http');
const fs = require('fs');
const path = require('path');
const Map = require('./map-db.js');
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


var Server = function(options,database,logger) {
    var self=this;
    var app = express();
    var httpClients=[];
    var session={};
    if (logger==null) logger=console;
    var map;
  

    app.use(express.static(options.public_path));
    
    var get=function (request, response) {

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
    });

    var io=require('socket.io').listen(httpServer);
    httpServer.on('error',function(e){
        logger.log('Can not listen on port '+options.port,e);
    });
    
    

    var connection = function(httpSocket) {
        var cookies=parseCookies(httpSocket.handshake.headers.cookie);
        
        if (typeof(cookies.sessid)!='undefined') {
            var hash=cookies.sessid;
        } else {
            var hash=md5(Math.random()+'_'+Date.now());
            httpSocket.emit('cookie','sessid',hash);
        }
        
        if (typeof(session[hash])=='undefined') {
            session[hash]={};
        }
        
        session[hash].socket=httpSocket;
        session[hash].hb=Date.now();
        
        
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
        logger.log('Hi there :)');
        var map = new Map(database,httpSocket,httpClients,session[hash]);
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