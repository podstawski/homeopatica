const crypto = require('crypto');

module.exports = function(database) {
    const algorithm = 'aes-256-ctr';
    
    return {
        checkRights: function(user,patient,cb) {
            var patient_access=database.t('patient_access');
            
            patient_access.select([{users:user,patient:patient}],null,function(d){
                if (d.data.length==0) cb(null);
                else cb(d.data[0]);
            });
        },
        email_std: function email_std(e) {
            return e.trim().toLowerCase();
        },
        
        md5: function md5(txt) {
            var md5sum = crypto.createHash('md5');
            md5sum.update(txt);
            return md5sum.digest('hex');
        },
        
        encrypt: function(text,password) {
            var cipher = crypto.createCipher(algorithm,password)
            var crypted = cipher.update(text,'utf8','hex')
            crypted += cipher.final('hex');
            return crypted;
        },
        
        decrypt: function(text,password) {
            var decipher = crypto.createDecipher(algorithm,password)
            var dec = decipher.update(text,'hex','utf8')
            dec += decipher.final('utf8');
            return dec;  
        }
    }
}