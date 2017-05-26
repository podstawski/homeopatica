const   Server=require('./src/backend/server.js'),
        Db=require('./src/backend/database.js'),
        Mailer=require('./src/backend/mailer.js');


var options=require('./options.js');
var mailer=new Mailer(options);

var db=new Db(options,function(){
    var server=new Server({port:options.listen_port,public_path:__dirname+'/public'},db,mailer);
});
