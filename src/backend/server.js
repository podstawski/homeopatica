var express = require('express');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var http = require('http');


var Server = function(options,logger) {
    var self=this;
    var app = express();
    if (logger==null) logger=console;

    app.use(express.static(options.public_path));
    
    var get=function (request, response) {
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