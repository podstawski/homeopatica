module.exports = function(database) {
    return {
        checkRights: function(user,patient,cb) {
            var patient_access=database.t('patient_access');
            
            patient_access.select([{users:user,patient:patient}],null,function(d){
                if (d.data.length==0) cb(null);
                else cb(d.data[0]);
            });
        }
    }
}