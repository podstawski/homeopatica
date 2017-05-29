const   nodemailer = require('nodemailer'),
        fs = require('fs'),
        smekta = require('./smekta.js');

module.exports = function(options) {
    var transporter = nodemailer.createTransport(options.nodemailer);
    
    const send = function(action,data,lang) {
        var header = require(__dirname+'/../mailer/default.js');
        var header2 = require(__dirname+'/../mailer/'+action+'.js');
        
        for (var k in header2) header[k]=header2[k];
        for (var k in header) {
            if (k=='locale') continue;
            if (typeof(header.locale[lang])!='undefined' && typeof(header.locale[lang][k])!='undefined')
                header[k]=header.locale[lang][k];
        }
        delete(header.locale);
        
        
        var after_read_file=function(html) {
            header.html=smekta(html.toString('UTF8'),data);
            
            transporter.sendMail(header, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
            });
            
        }
        
 
        for (var k in header) header[k]=smekta(header[k],data);
  
        fs.readFile(__dirname+'/../mailer/'+action+'_'+lang+'.html',function(err,html){
            if (!err) {
                after_read_file(html);
                return;
            }
            fs.readFile(__dirname+'/../mailer/'+action+'.html',function(err,html){
                if (!err) {
                    after_read_file(html);
                    return;
                }
                console.log('No mail file for action',action);
            });
        });
    }
    
    return {
        send: send
    }
    
}