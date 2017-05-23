var Server=require('./src/backend/server.js');
var Db=require('./src/backend/database.js');

var options=require('./options.js');

var db=new Db(options,function(){
    var server=new Server({port:options.listen_port,public_path:__dirname+'/public'},db);
});
