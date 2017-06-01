const   $ = require('jquery'),
        toastr = require('toastr'),
        datatables = require('datatables.net'),
        dtlang = require('./dt-lang.js');
        
require('datatables.net-dt/css/jquery.dataTables.css');

module.exports = function(socket) {
    
    const patientColumns = [
        {
            title: $.translate('Name'),
            data: "name",
            sortable: false,		
            render: function ( data, type, full, meta ) {
                //var ch=data==1?'checked':'';
                return data;
            }
        }
    ];
    
    $('table.patients').DataTable({
        language: {
            url: dtlang(navigator.language || navigator.userLanguage)
        },
        columns: patientColumns
    });
    
    
    const get_patients = function() {
        socket.emit('patients');    
    }
    
    $('.doctor div.plus').click(function(e){
        socket.emit('add-patient');
        
    });
    
    socket.on('add-patient',function(p){
        toastr.success($.translate('Patient added'), $.translate('Patient status!'));
        get_patients();
    });
    
    socket.on('patients',function(patients){
        console.log(patients);
        
        var data=patients.data;
        var datatable = $('.patients').dataTable().api();
        
        for (var i=0; i<data.length;i++) {
            data[i].DT_RowId=data[i].id;

            if (data[i].name==null) data[i].name='ala';
        }
        
        datatable.clear();
        datatable.rows.add(data);
        datatable.draw();
        
    });
    
    return {
        get_patients: get_patients
    }
}