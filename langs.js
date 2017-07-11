var options=require('./options.js');
var fs = require('fs');
const getLangs = require('./src/dev/langs.js');


getLangs(options.locale_spreadsheet,function(langs) {
 
    fs.writeFile(__dirname+'/src/frontend/langs.js',
                 'module.exports='+JSON.stringify(langs)+';',function(err){
                    if(err) console.log(err);
                    process.exit();
    });
        
});