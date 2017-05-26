const   nodemailer = require('nodemailer'),
        fs = require('fs');

module.exports = function(options) {
    var transport = nodemailer.createTransport(options.nodemailer);
    
    const send = function(action,data,lang) {
        var header = require(__dirname+'/../mailer/default.js');
        var header2 = require(__dirname+'/../mailer/'+action+'.js');
        
        for (var k in header2) header[k]=header2[k];
        for (var k in header) {
            if (k=='locale') continue;
            if (typeof(header.locale[lang][k])!='undefined') header[k]=header.locale[lang][k];
        }
        delete(header.locale);
    }
    
    return {
        send: send
    }
    
}