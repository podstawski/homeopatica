const   $ = require('jquery'),
        toastr = require('toastr'),
        datatables = require('datatables.net'),
        dtlang = require('./dt-lang.js'),
        select2 = require('select2'),
        moment = require('moment');
        
require('datatables.net-dt/css/jquery.dataTables.css');
require('select2/dist/css/select2.min.css');

module.exports = function(socket) {
    
    const language = navigator.language || navigator.userLanguage;
    moment.locale(language);
    const select2_width='70%;'
    
    const patientColumns = [
        {
            title: $.translate('Name of patient'),
            data: "name",
            className: 'patient-name',
            render: function ( data, type, full, meta ) {
                if (data==null || data.length==0)
                    return '<input placeholder="'+$.translate('Enter patient name')+'"/>';
                return data;
            }
        },
        {
            title: $.translate('Attributes'),
            sortable: false,
            className: 'attr',
            render: function ( data, type, full, meta ) {
                var html='';
                var year=new Date().getFullYear();
                
                html+='<input type="radio" name="gender['+full.id+']" value="M" id="g_m_'+full.id+'"';
                if (full.gender!=null && full.gender=='M') html+=' checked';
                html+='><label for="g_m_'+full.id+'" class="gm" title="'+$.translate('Male')+'"></label>';
                
                html+='<input type="radio" name="gender['+full.id+']" value="F" id="g_f_'+full.id+'"';
                if (full.gender!=null && full.gender=='F') html+=' checked';
                html+='><label for="g_f_'+full.id+'" class="gf" title="'+$.translate('Female')+'"></label>';
                
                html+='<select name="yob">';
                html+='<option value="">'+$.translate('Year of birth')+'</option>';
                for (var i=year; i>year-110;i--) {
                    let selected=(full.yob!=null && full.yob==i)?' selected':'';
                    html+='<option value="'+i+'"'+selected+'>'+i+'</option>';
                }
                html+='</select>';
                
                html+='<select name="mob">';
                html+='<option value="">'+$.translate('Month of birth')+'</option>';
                for (var i=1; i<=12;i++) {
                    let selected=(full.mob!=null && full.mob==i)?' selected':'';
                    html+='<option value="'+i+'"'+selected+'>'+i+'</option>';
                }
                html+='</select>';
                
                html+='<input type="checkbox"';
                if (full.notifications!=null && full.notifications==1) {
                    html+=' checked';
                }
                html+='/>';
                
                
                return html;
            }
        },
        {
            title: $.translate('Options'),
            className: 'interviews',
            sortable: false,
            render: function ( data, type, full, meta ) {
                var html='<select class="notshare"><option value="0">'+$.translate('Interviews')+'</option></select>';
                html+='<div class="add notshare" title="'+$.translate('Add an interview')+'"></div>';
                html+='<div class="share" title="'+$.translate('Share this patient')+'"></div>';
                return html;
            }
        }
    ];
    
    $('table.patients').DataTable({
        language: {
            url: dtlang(navigator.language || navigator.userLanguage)
        },
        columns: patientColumns,
        order: []
    });
    
    
    const get_patients = function() {
        socket.emit('patients');    
    }
    
    $('.doctor div.plus').click(function(e){
        socket.emit('add-patient');
        
    });
    
    
    $(document).on('change','.doctor .patient-name input',function(e){
        socket.emit('patient',$(this).closest('tr').attr('id'),{name:$(this).val()});
        $(this).closest('td').text($(this).val());
    });
    
    $(document).on('click','.doctor .attr label',function(e){
        var gender=$('#'+$(this).attr('for')).val();
        socket.emit('patient',$(this).closest('tr').attr('id'),{gender:gender});
    });
    $(document).on('change','.doctor .attr select',function(e){
        var obj={};
        obj[$(this).attr('name')]=parseInt($(this).val());
        socket.emit('patient',$(this).closest('tr').attr('id'),obj);
    });
    
    $(document).on('click','.doctor td.patient-name',function(e){
        var td=$(this);
        if (td.html().indexOf('<input')>-1) return;
        td.html('<input value="'+td.text()+'"/>');
        td.find('input').focus();
        
    });
    
    $(document).on('click','.doctor .interviews div.add',function(e){
        socket.emit('add-examination',$(this).closest('tr').attr('id'));
        $(this).fadeOut(500);
        
    });
    
    socket.on('add-examination',function(examination){
        if (examination==null) {
            return;
        }
        window.location.href='/map/'+examination.id;
    });
    
    socket.on('add-patient',function(p){
        toastr.success($.translate('Patient added'), $.translate('Patient status!'));
        get_patients();
    });
    
    socket.on('patients',function(patients){
        
        
        var data=patients.data;
        var datatable = $('.patients').dataTable().api();
        
        for (var i=0; i<data.length;i++) {
            data[i].DT_RowId=data[i].id;

            if (data[i].name==null) data[i].name='';
        }
        
        datatable.clear();
        datatable.rows.add(data);
        datatable.draw();
        
        $('.doctor td.interviews select').select2({width:select2_width}).on('select2:opening',function(e){
            var element=$(this);
            
            if (typeof(element.attr('examinations'))!='undefined') {
                return;
            }

            
            socket.emit('examinations',$(this).closest('tr').attr('id'));
            socket.once('examinations',function(examinations){
                if (!examinations || examinations.recordsTotal==0) {
                    return;
                }
                element.attr('examinations','1');
                
                var options=[{
                    id:0,
                    text: $.translate('Interviews')
                }];
                
                for (var i=0; i<examinations.recordsTotal; i++) {
                    options.push({
                        id:examinations.data[i].id,
                        text:examinations.data[i].title+'. '+moment(examinations.data[i].date).format('DD MMM YYYY')
                    });
                }
                element.select2({data: options, width:select2_width});
                element.select2('open');
                
            });
        }).on('select2:select',function(e){
            if( parseInt($(this).val())==0) return;
            window.location.href='/map/'+$(this).val();
        });
        
    });
    
    
    $('.translate').translate();
    
    return {
        get_patients: get_patients
    }
}