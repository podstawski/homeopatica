const csv = require('./getCsv.js');

module.exports = function(key,cb) {
    csv(key,false,function(data) {
    
        var header=data[0];
    
        var langs={};
        
        for(var i=1;i<data.length;i++)
        {
            var line=data[i];
            
            var label=line[0];
            
            for (var j=1;j<line.length;j++)
            {
                if (line[j].length==0) continue;
                if (typeof(header[j])=='undefined') {
                    console.log('ERROR',line);
                    process.exit();
                }
                
                if (typeof(langs[header[j]])=='undefined') langs[header[j]]={};
                langs[header[j]][label]=line[j];
            }
            
        }
        
        cb(langs);
        
    });
}