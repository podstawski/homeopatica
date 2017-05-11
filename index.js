var Server=require('./src/backend/server.js');


var server=new Server({port:3000,public_path:__dirname+'/public'});