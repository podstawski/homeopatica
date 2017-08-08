

var connections={};

var Model = function(opt,logger) {
    var connection=null;
    var _fields;
    var inited=false;
    var self=this;
    
    if (logger==null) logger=console;

    var connect = function (cb,reconn) {
        var token=opt.host+':'+opt.database;
        if (connection!=null && !reconn) {
            if(typeof(cb)=='function') cb();
        } else if (connections[token]!==undefined && !reconn){
            connection=connections[token];
            if(typeof(cb)=='function') cb();
        } else {
            var mysql = require('mysql');
            if (connections[token]!==undefined) delete(connections[token]);
            connection=mysql.createConnection(opt);
            connection.connect(function(err){
                if(!err) {
                    connections[token]=connection;
                    logger.log('Database '+opt.database+' is connected');
                    if(typeof(cb)=='function') cb();
                } else {
                    connection=null;
                    logger.log('Error connecting database '+opt.database,err);
                    process.kill(process.pid, 'SIGTERM');
                }
            });
            connection.on('error', function(err) {
                logger.log('disconnected',err);
                process.kill(process.pid, 'SIGTERM');
                connection.destroy();
                setTimeout(function(){
                    connect(null,true);
                },1000);
                
            });
        }
    }
    
    var getFields = function(cb) {
        
        var sql="SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='"+opt.database+"' AND table_name='"+opt.table+"'";
        connection.query(sql, function(err, rows, fields) {
            _fields={};
            for (var i=0; i<rows.length; i++) {
                _fields[rows[i].column_name]=rows[i].data_type;
            }
            if (cb) cb();
        });
    }
    
    var addslashes = function(key,val) {
        var type=_fields[key];
        
        switch (type) {
            case 'int': {
                return val;
            }
            default: {
                return "'"+val+"'";
            }
        }
    }
    
    var indexCondition = function (idx) {
        var where='';
        
        if (typeof(idx)=='object') {
            for (var i=0;i<opt.index.length; i++) {
                if (where.length>0) where+=' AND ';
                where+=opt.index[i]+'='+addslashes(opt.index[i],idx[opt.index[i]]);
            }
        } else {
            where=opt.index[0]+'='+addslashes(opt.index[0],idx);
        }
        
        return where;
    };
    
    var addFieldSql = function (k,v,cb) {
        sql='ADD COLUMN '+k+' ';
        var type=typeof(v);
        if (v==null) type='number';
        if (k=='date') type='number';
        if (typeof(opt.tables[k])!='undefined') type='fk';
        if (k=='parent') type='fks';
        
        switch (type) {
            case 'number': {
                if (String(v).indexOf('.')>0) {
                    sql+='float(6)';
                } else {
                    sql+='bigint';    
                }
                
                break;
            };
            case 'fk': {
                sql+='INT(6) UNSIGNED, ADD CONSTRAINT FOREIGN KEY ('+k+') REFERENCES '+k+'(id) ON DELETE SET NULL ON UPDATE CASCADE';
                break;
            };
            case 'fks': {
                sql+='INT(6) UNSIGNED, ADD CONSTRAINT FOREIGN KEY ('+k+') REFERENCES '+opt.table+'(id) ON DELETE SET NULL ON UPDATE CASCADE';  
                break;
            };
            default:
                sql+='text';
                break
        }
        
        
        return sql;

        
    };
    
    var checkFields = function (d,cb) {
        var sql='';

        for (var k in d) {
            if (k.indexOf('.')>0) continue;
            if (typeof(_fields[k])=='undefined') {
                sql+=addFieldSql(k,d[k])+',';
            }
        }
        if (sql.length==0) {
            cb();
        } else {
            
            sql='ALTER TABLE '+opt.table+' '+sql.substr(0,sql.length-1);
            //console.log(sql);
            connection.query(sql, function(err, rows) {
                if (!err) {
                    getFields(cb);
                }
            });            
        }
       
    }
    
    var where2whereObj = function(where,cb) {
        var obj={};
        
        for (var i=0; i<where.length; i++) {
            for (var k in where[i]) {
                obj[k]=where[i][k];
            }
        }
        
        
        checkFields(obj,function(){
            var ors=[],ands;
            var v=[];
            for (var i=0; i<where.length; i++) {
                ands=[];
                for (var k in where[i]) {
                    if (where[i][k]!=null) {
                        if (typeof(where[i][k])=='object') {
                            ands.push(k+where[i][k][0]+'?');
                            v.push(where[i][k][1]);
                        } else {
                            ands.push(k+'=?');
                            v.push(where[i][k]);
                        }
                    } else {
                        ands.push(k+' IS NULL');
                    }
                }
                ors.push('('+ands.join(' AND ')+')');
            }
            cb({where:ors.join(' OR '),values:v});
            
        });
    };
    
    
    var json=function(obj) {
        for (var k in obj) {
            if (obj[k]==null) continue;
            
            if (typeof(obj[k])=='object') {
                obj[k]='json:'+JSON.stringify(obj[k]);
            } else if (typeof(obj[k])=='string' && obj[k].substr(0,5)=='json:') {
                obj[k]=JSON.parse(obj[k].substr(5));
            }
        }
        return obj;
    }
    
    var jsona=function(a) {
        for (var i=0; i<a.length; i++) json(a[i]);
        
        return a;
    }

    var getOne=function(idx,cb) {
        var sql="SELECT * FROM "+opt.table+" WHERE "+indexCondition(idx);
        connection.query(sql,function(err,rows) {
            if (!err && rows.length>0) cb(json(rows[0]));
            else cb(null);
        });          
        
    };

    var select=function (where,order,cb,ctx,leftjoin) {
        var sql="SELECT * FROM "+opt.table;
        if (leftjoin) {
            var lj='';
            for ( var t in leftjoin) {
                if (lj.length>0) lj+=',';
                lj+=t+' ON '+opt.table+'.'+leftjoin[t]+'='+t+'.id';
            }
            sql+=' LEFT JOIN '+lj;
        }
        var orderby='';
        if (order) orderby=' ORDER BY '+order.join(',');
        
        if (where) {
            
            where2whereObj(where,function(obj){
                sql+=' WHERE '+obj.where;
                
                //console.log(sql,obj.values);
                connection.query(sql+orderby,obj.values,function(err, rows) {
                    
                    if (!err) cb({recordsTotal:rows.length,data:jsona(rows),ctx:ctx});
                    else {
                        console.log(err);
                        cb({recordsTotal:0,data:[],ctx:ctx});
                    }
                });
            });
        } else {
             connection.query(sql+orderby,function(err, rows) {
                if (!err) cb({recordsTotal:rows.length,data:jsona(rows),ctx:ctx});
                else cb({recordsTotal:0,data:[],ctx:ctx});
            });
        }
    }

    
    return {
        init: function (cb) {
            if (inited) {
                if (cb) cb();
                return self;
            }
            connect(function(){
                var sql='SELECT * FROM information_schema.tables WHERE table_schema = \''+opt.database+'\' AND table_name = \''+opt.table+'\' LIMIT 1;';
                connection.query(sql, function(err, rows, fields) {
                    if (rows.length==0) {
                        sql='CREATE TABLE '+opt.table+' (';
                        for (var i=0;i<opt.index.length;i++) {
                            sql+=opt.index[i];
                            if (opt.index[i]=='id') sql+=' INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY, ';
                            else sql+=' varchar(128) PRIMARY KEY,';
                        }
                        sql+='_created BIGINT, ';
                        sql+='_updated BIGINT';
                        sql+=') DEFAULT CHARACTER SET=utf8;';
                        //console.log(sql);
                        connection.query(sql,function() {                            
                            getFields(function(){
                                inited=true;
                                if (cb) cb();
                            });
                        });
                    } else {
                        getFields(function(){
                            inited=true;
                            if (cb) cb();
                        });
                    }
                    
                });

            });
            return self;
        },
        
        getAll: function(cb) {
            var sql='SELECT * FROM '+opt.table;
            connection.query(sql, function(err, rows, fields) {
                cb({recordsTotal:rows.length,data:jsona(rows)});
            });
            
        },
        
        get: function(idx,cb) {
            return getOne(idx,cb);
        },
        
        
        select: select,
        
        leftjoin: function(tables,where,order,cb,ctx) {
            select(where,order,cb,ctx,tables);
        },
        
        set: function(d,idx,cb) {
            if (idx==null) {
                idx=d[opt.index[0]];
            } else if (typeof(idx)=='function') {
                cb=idx;
                idx=d[opt.index[0]];
            }
            
            var set='_updated=?';
            var values=[Date.now()];
            
            json(d);
            checkFields(d,function(){
                for (var k in d) {
                    if (k=='_updated' || k=='_created') {
                        continue;
                    }
                    
                    set+=', '+k+'=?';
                    values.push(d[k]);
                }
                            
                var sql='UPDATE '+opt.table+' SET '+set+' WHERE '+indexCondition(idx);
                connection.query(sql, values, function(err, res) {
                    if (!err && cb!=null) getOne(idx,cb);
                });
            });
        },
        
        count: function(where,cb) {
            if (!connection) {
                cb(null);
                return;
            }
            var sql="SELECT count(*) AS c FROM "+opt.table;
            if (where) {
                where2whereObj(where,function(obj){
                    sql+=' WHERE '+obj.where;
                    connection.query(sql,obj.values,function(err, rows) {
                        if (!err && rows.length>0) cb(rows[0].c);
                        else cb(0);
                    });
                });
            } else {
                 connection.query(sql,function(err, rows) {
                    if (!err) cb(rows[0].c);
                });
            }
            
        },
        
        add: function(d,cb) {

            d['_created']=Date.now();
            d['_updated']=Date.now();
            
            json(d);
            
            checkFields(d,function(){
                connection.query('INSERT INTO '+opt.table+' SET ?',d,function(err,res){
                    if (!err && cb) getOne(res.insertId,cb);
                });
            });
            
        },
        
        truncate: function(cb) {
            var sql="TRUNCATE TABLE "+opt.table;
            connection.query(sql,function(err,res) {
                if (!err && cb) cb();
            });
        },
        
        remove: function (idx,cb) {
            var sql="DELETE FROM "+opt.table+" WHERE "+indexCondition(idx);
    
            connection.query(sql,function(err,res) {
                if (!err && cb) cb();
            });
        },
        
        index: function(data) {
        },
        
        max: function(element,where,cb) {
            var sql="SELECT max("+element+") AS m FROM "+opt.table;
            if (where) {
                where2whereObj(where,function(obj){
                    sql+=' WHERE '+obj.where;
                    connection.query(sql,obj.values,function(err, rows) {
                        if (!err) cb(rows[0].m);
                        else cb(0);
                    });
                });
            } else {
                 connection.query(sql,function(err, rows) {
                    if (!err) cb(rows[0].m);
                    else cb(0);
                });
            }            
        },
        
        ultimateSave: function () {
        },
        
        inited: function () {
            return inited;
        },
        
        reconnect: function(cb) {
            connect(cb,true);
        }
        
 
    }
}


module.exports = Model;
