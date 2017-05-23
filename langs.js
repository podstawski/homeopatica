var options=require('./options.js');
var exec = require('child_process').exec;
var fs = require('fs');

var przecinek2strumien = function(data) {

    var last_data=data;
    while(true)
    {
        data=data.replace(/,"([^"]+),([^"]+)",*/g,',$1ZJEBANY_PRZECINEK$2,');
       
        if (last_data==data) break;
        last_data=data;
    }
    
    data=data.replace(/"/g,'').replace(/,/g,'~').replace(/ZJEBANY_PRZECINEK/g,',');
    
    while (data.substr(-1)=='~') data=data.substr(0,data.length-1);
  

    return data;
    
}



var url='https://docs.google.com/spreadsheet/ccc?key='+options.locale_spreadsheet+'&output=csv';

exec('wget -q -O - "'+url+'"',function(err,stdout,stderr) {
    
    if (!stdout) return;
    
    var data=stdout.split("\n");
    var header=przecinek2strumien(data[0].trim()).split('~');

    
    var langs={};
    
    for(var i=1;i<data.length;i++)
    {
        var line=przecinek2strumien(data[i].trim()).split('~');
        
        var label=line[0];
        
        for (var j=1;j<line.length;j++)
        {
            if (line[j].length==0) continue;
            if (typeof(header[j])=='undefined') {
                console.log('ERROR',line,data[i]);
                process.exit();
            }
            
            if (typeof(langs[header[j]])=='undefined') langs[header[j]]={};
            langs[header[j]][label]=line[j];
        }
        
    }
    
    fs.writeFile(__dirname+'/src/frontend/langs.js',
                 'module.exports='+JSON.stringify(langs)+';',function(err){
        process.exit();
    });
    
    
});