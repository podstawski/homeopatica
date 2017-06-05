const crypto = require('crypto');

module.exports = function(database) {
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
        }
    }
}