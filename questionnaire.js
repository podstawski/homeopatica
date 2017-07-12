const  Db=require('./src/backend/database.js');
var options=require('./options.js');
const getLangs = require('./src/dev/langs.js');
const csv = require('./src/dev/getCsv.js');

const count = function (obj) {
    return Object.keys(obj).length;
}

var db=new Db(options,function(){
    var questionnaire=db.t('questionnaire');
    var answers=db.t('answers');
    
    questionnaire.init(function() {
        answers.init(function() {
            getLangs(options.questionnaire_spreadsheet[2],function(trans){
                csv(options.questionnaire_spreadsheet[0],true,function(questionnaire_data){
                    csv(options.questionnaire_spreadsheet[1],true,function(answers_data){
                        
                        var questionnaire_ids={};
                        var answers_ids={};
                        var answers_queue={};
                        
                        const runForestRun = function() {
                            
                            if (count(answers_queue)==0 && count(answers_ids)==0) {
                                //process.exit();
                                return;
                            }
                        
                            for (var code in answers_queue) {
                                if (questionnaire_ids[code]==null) continue;
                                for (var i=0; i<answers_queue[code].length; i++) {
                                    answers_queue[code][i].questionnaire = questionnaire_ids[code];
                                    answers.add(answers_queue[code][i],function(a){
                                        console.log('Answer',a.code);
                                    });
                                }
                                delete (answers_queue[code]);
                            }
                            setTimeout(runForestRun,1000);
                        }
                        
                        questionnaire.truncate(function(){
                            console.log('questionnaire emptied');
                        });
                        
                        for (var i=0; i<questionnaire_data.length ;i++){
                            var code=questionnaire_data[i].code;
                            
                            for (var lang in trans) {
                                
                                if (typeof(trans[lang][code])!='undefined') {
                                    questionnaire_data[i][lang]=trans[lang][code];
                                }
                            }
                            if (questionnaire_data[i].answer!=null && questionnaire_data[i].answer.length>0) {
                                if (answers_ids[questionnaire_data[i].answer]==null) {
                                    answers_ids[questionnaire_data[i].answer]=[];
                                }
                                answers_ids[questionnaire_data[i].answer].push(questionnaire_data[i]);
                                continue;
                            }
                            
                            questionnaire.add(questionnaire_data[i],function(data){
                                questionnaire_ids[data.code] = data.id;
                                console.log('Question',data.code);
                            });
                            
                        }
                        
                        for (var i=0; i<answers_data.length ;i++){
                            
                            var code=answers_data[i].code;
                            
                            for (var lang in trans) {
                                if (typeof(trans[lang][code])!='undefined') {
                                    answers_data[i][lang]=trans[lang][code];
                                }
                            }
                            
                            
                            if (answers_queue[answers_data[i].questionnaire]==null) {
                                answers_queue[answers_data[i].questionnaire]=[];
                            }
                            answers_queue[answers_data[i].questionnaire].push(answers_data[i]);
                        }
                        
                        answers.truncate(function(){
                            console.log('answers emptied');
                        });
                        
                        runForestRun();
                    });
                });
            });
            
        });
    });
    
});
