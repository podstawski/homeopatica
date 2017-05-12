var Server=require('./src/backend/server.js');
var Db=require('./src/backend/database.js');



var db=new Db({
    host:'173.194.250.90',
    user:'homeopatica',
    password:'homeopatica',
    database:'homeopatica',
},function(){
    
    var server=new Server({port:3000,public_path:__dirname+'/public'},db);
});

