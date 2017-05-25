const   Server=require('./src/backend/server.js'),
        Db=require('./src/backend/database.js'),
        nodemailer = require('nodemailer');


var options=require('./options.js');
var mailer=nodemailer.createTransport(options.nodemailer);

var db=new Db(options,function(){
    var server=new Server({port:options.listen_port,public_path:__dirname+'/public'},db,mailer);
});
