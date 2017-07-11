var comma2wave = require('./comma2wave.js');
var exec = require('child_process').exec;

module.exports = function (key,toObj,cb) {
    var url='https://docs.google.com/spreadsheet/ccc?key='+key+'&output=csv';
    
    exec('wget -q -O - "'+url+'"',function(err,stdout,stderr) {
        if (!stdout) return;
        
        var data=stdout.split("\n");
        var ret=[];
        var header;
        
        if (toObj) header=comma2wave(data[0].trim()).split('~');
        
        for(var i=0;i<data.length;i++) {
            if (toObj && i==0) continue;
            var line=comma2wave(data[i].trim()).split('~');
            
            if (toObj) {
                var rec={};
                for (var j=0; j<line.length; j++) {
                    var v=line[j];
                    if (!isNaN(parseInt(v))) {
                        v=parseInt(v);
                        if (v+''!=line[j]) {
                            v=line[j];
                        }
                    }
                    rec[header[j]] = v;
                }
                ret.push(rec);
            } else {
                ret.push(line);
            }
        }
        cb(ret);
    });
}