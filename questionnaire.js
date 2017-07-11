const  Db=require('./src/backend/database.js');
var options=require('./options.js');
const getLangs = require('./src/dev/langs.js');
const csv = require('./src/dev/getCsv.js');


var db=new Db(options,function(){
    var questionnaire=db.t('questionnaire');
    var answers=db.t('answers');
    
    questionnaire.init(function() {
        answers.init(function() {
            getLangs(options.questionnaire_spreadsheet[2],function(trans){
                csv(options.questionnaire_spreadsheet[0],true,function(questionnaire_data){
                    csv(options.questionnaire_spreadsheet[1],true,function(answers_data){
                        
                        for (var i=0; i<questionnaire_data.length ;i++){
                            var code=questionnaire_data[i].code;
                            delete(questionnaire_data[i].code);
                            for (var lang in trans) {
                                
                                if (typeof(trans[lang][code])!='undefined') {
                                    questionnaire_data[i][lang]=trans[lang][code];
                                }
                            }
                            
                        }
                        console.log(questionnaire_data);
                        
                    });
                });
            });
            
        });
    });
    
});
