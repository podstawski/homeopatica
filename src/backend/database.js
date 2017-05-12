
var Model=require(__dirname+'/mysql-model');

var DB = function(opt,cb) {
    var tables={};
    
    var newmodel=function (table) {
        return new Model({
            host:opt.host,
            user:opt.user,
            password:opt.password,
            database:opt.database,
            index:['id'],
            table:table,
            tables:tables
        });
    }
    tables.users=newmodel('users');
    tables.users.init(cb);
    
    return {
        't': function(name) {
            if (typeof(tables[name])!='undefined') return tables[name];
            tables[name]=newmodel(name);
            tables[name].init();
            return tables[name];
        }
    }
}

module.exports = DB;