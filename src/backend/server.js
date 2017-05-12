const express = require('express');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const http = require('http');
const fs = require('fs');
const path = require('path');
const Map = require('./map-db.js');


var Server = function(options,database,logger) {
    var self=this;
    var app = express();
    if (logger==null) logger=console;
  

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
        var disconnect = function() {
            logger.log('Bye :)');    
        };
        logger.log('Hi there :)');
        new Map(database,httpSocket);
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