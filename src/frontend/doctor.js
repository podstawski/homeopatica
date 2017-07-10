const   $ = require('jquery'),
        toastr = require('toastr'),
        datatables = require('datatables.net'),
        dtlang = require('./dt-lang.js'),
        select2 = require('select2'),
        common = require('./common.js'),
        moment = require('moment');
        
require('datatables.net-dt/css/jquery.dataTables.css');
require('select2/dist/css/select2.min.css');

module.exports = function(socket) {

    const language = common.lang();
    moment.locale(language);
    const select2_width='70%;'
    
    var myStorage = common.storage();
    var hashTable={};
    
    
    
    const store=function(id,key,val) {
        id=parseInt(id);
        if (typeof(myStorage[hashTable[id]])=='undefined') {
            myStorage[hashTable[id]]={};
        }
        myStorage[hashTable[id]][key] = val;
        common.storage(myStorage);
    };
    
    const download=function (data, filename, type) {
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
           
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
    }

    
    const patientColumns = [
        {
            title: $.translate('Name of patient'),
            data: "hash",
            className: 'patient-nick',
            render: function ( data, type, full, meta ) {
                if (myStorage==null) return '';
                
                var name='';
                if (typeof(myStorage[data])!='undefined') {
                    name=myStorage[data].name;
                }
                
                
                if (name.length==0)
                    return '<input placeholder="'+$.translate('Enter patient name')+'"/>';
                    
                return name;
            }
        },
        {
            
            title: $.translate('Nick of patient'),
            data: "name",
            className: 'patient-name',
            width: '15%',
            render: function ( data, type, full, meta ) {
                if (data==null || data.length==0)
                    return '<input placeholder="'+$.translate('Enter patient nickname')+'"/>';
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
                
                if (full.acl_write==1) {
                    html+='<input type="radio" name="gender['+full.id+']" value="M" id="g_m_'+full.id+'"';
                    if (full.gender!=null && full.gender=='M') html+=' checked';
                    html+='><label for="g_m_'+full.id+'" class="gm gender" title="'+$.translate('Male')+'"></label>';
                    
                    html+='<input type="radio" name="gender['+full.id+']" value="F" id="g_f_'+full.id+'"';
                    if (full.gender!=null && full.gender=='F') html+=' checked';
                    html+='><label for="g_f_'+full.id+'" class="gf gender" title="'+$.translate('Female')+'"></label>';
                    
    
                    
                    html+='<select name="mob">';
                    html+='<option value="">'+$.translate('Month of birth')+'</option>';
                    for (var i=1; i<=12;i++) {
                        let selected=(full.mob!=null && full.mob==i)?' selected':'';
                        html+='<option value="'+i+'"'+selected+'>'+moment.monthsShort()[i-1]+'</option>';
                    }
                    html+='</select>';
    
                    html+='<select name="yob">';
                    html+='<option value="">'+$.translate('Year of birth')+'</option>';
                    for (var i=year; i>year-110;i--) {
                        let selected=(full.yob!=null && full.yob==i)?' selected':'';
                        html+='<option value="'+i+'"'+selected+'>'+i+'</option>';
                    }
                    html+='</select>';
                                        
                } else {
                    var age=common.age(full.yob,full.mob);
                    html+='<div class="age">'+common.gender(full.gender,age)+', '+age+'</div>';
                }

                html+='<input type="checkbox" class="notifications" id="not_'+full.id+'"';
                if (full.notifications!=null && full.notifications==1) {
                    html+=' checked';
                }
                html+='/>';
                
                html+='<label class="notifications" title="'+$.translate('Receive email notifications')+'" for="not_'+full.id+'"></label>';
                
                return html;
            }
        },
        {
            title: $.translate('Options'),
            className: 'interviews',
            sortable: false,
            render: function ( data, type, full, meta ) {
                var html='<select class="notshare"><option value="0">'+$.translate('Interviews')+'</option></select>';
                
                if (full.acl_write==1) {
                    html+='<div class="add notshare" title="'+$.translate('Add an interview')+'"></div>';
                    html+='<div class="share" title="'+$.translate('Share this patient')+'"></div>';
                    
                    html+='<div class="share-wraper"></div>';
                    html+='<input class="share" placeholder="'+$.translate('Enter comma separated emails')+'"/>';
                }
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
    
    $(document).on('change','.doctor .patient-nick input',function(e){
        store($(this).closest('tr').attr('id'),'name',$(this).val());
        $(this).closest('td').text($(this).val());
    });
    
    $(document).on('click','.doctor .attr label.gender',function(e){
        var gender=$('#'+$(this).attr('for')).val();
        socket.emit('patient',$(this).closest('tr').attr('id'),{gender:gender});
    });
    
    $(document).on('click','.doctor .attr label.notifications',function(e){
        var notifications=$('#'+$(this).attr('for')).prop('checked')?0:1;
        socket.emit('patient_access',$(this).closest('tr').attr('id'),{notifications:notifications});
    });
    
    $(document).on('change','.doctor .attr select',function(e){
        var obj={};
        obj[$(this).attr('name')]=parseInt($(this).val());
        socket.emit('patient',$(this).closest('tr').attr('id'),obj);
    });
    
    $(document).on('click','.doctor div.save',function(e){
        socket.emit('encrypt',myStorage);
    });
    
    socket.on('encrypt', function(data) {
        download(data,$.translate('patients')+'.txt','text');
    });
    
    socket.on('decrypt', function(data) {
        for (var key in data) {
            myStorage[key]=data[key];
        }
        common.storage(myStorage);
    
        
        var a = document.createElement("a");
        a.href = window.location.href;    
        document.body.appendChild(a);
        a.click();
    });
    
    const readSingleFile = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        reader.onload = function(e) {
            socket.emit('decrypt',e.target.result);
        };
        reader.readAsText(file);  
    };
    
    const restoreShare = function(input) {
       var td=input.closest('td');
        input.fadeOut(500,function(){
            td.find('div.share-wraper').hide();
            td.find('.notshare,.select2,div.share').fadeIn(500);
            $('.sharer').fadeOut(500);
        });
        
    };
    
    
    $(document).on('change','.doctor .patients .interviews input.share',function(e){
        restoreShare($(this));
        if ($(this).val().trim().length>0) socket.emit('share',$(this).closest('tr').attr('id'),$(this).val(),language);
    });
    
    $(document).on('blur','.doctor .patients .interviews input.share',function(e){
        if ($(this).val().trim().length==0) restoreShare($(this));
    });
    
    $(document).on('click','.doctor td.patient-name,.doctor td.patient-nick',function(e){
        var td=$(this);
        if (td.html().indexOf('<input')>-1) return;
        td.html('<input value="'+td.text()+'"/>');
        td.find('input').focus();
        
    });
    
    $(document).on('click','.doctor .interviews div.add',function(e){
        socket.emit('add-examination',$(this).closest('tr').attr('id'));
        $(this).fadeOut(500);
        
    });
    
    $(document).on('click','.doctor .interviews div.share',function(e){
        var td=$(this).closest('td');
        var id=$(this).closest('tr').attr('id');
        
        td.find('.notshare,.select2').fadeOut(500,function(){
            td.find('input.share').fadeIn(500).focus();
            td.find('div.share-wraper').show();
        });
        $(this).fadeOut(500);
        $('.sharer').attr('rel',id);
        $('.sharer').attr('name',$(this).closest('tr').find('.patient-name').text());
        $('.sharer').css({
            top: e.pageY + 30,
            right: 20
        });
        socket.emit('shares',id);
        
    });
    
    
    $(document).on('click','.doctor .sharer ul div.write input',function(e){
        var id=$(this).attr('id').split('_');
        socket.emit('write',id[0],id[1],$(this).prop('checked'));
    });
    
    $(document).on('click','.doctor .sharer ul div.remove',function(e){
        var id=$(this).closest('li').attr('rel').split('_');
        socket.emit('unshare',id[0],id[1]);
    });
    
    socket.on('shares',function(shares) {
        console.log(shares);
        var id=$('.sharer').attr('rel');
        var name=$('.sharer').attr('name');
        
        var input=$('table.patients #'+id+' input.share');
        console.log(input);
        if (shares==null) {
            restoreShare(input);
            input.hide();
            toastr.error($.translate('You are not allowed to share')+' '+name,$.translate('Share'));
        }
        
        if (shares.length>0) {
            var html='<ul>';
            for (var i=0; i<shares.length; i++) {
                var aid=id+'_'+shares[i].users;
                html+='<li rel="'+aid+'">';
                html+='<div class="email">'+shares[i].email+'</div>';
                var ch=shares[i].acl_write==1?'checked':'';
                html+='<div class="write" title="'+$.translate('May change')+'"><input type="checkbox" '+ch+' id="'+aid+'"><label for="'+aid+'"></label></div>';
                html+='<div class="remove" title="'+$.translate('Stop sharing')+'"></div>';
                html+='</li>';
            }
            html+='</ul>';
            $('.sharer').html(html).show();
        }
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
    
    socket.on('patient',function(id,p){
        if (!p) toastr.warning($.translate('You are not allowed to change this data'), $.translate('Patient status!'));
    });
    
    socket.on('patients',function(patients){
        
        
        var data=patients.data;
        var datatable = $('.patients').dataTable().api();
        
        for (var i=0; i<data.length;i++) {
            data[i].DT_RowId=data[i].id;
            hashTable[data[i].id]=data[i].hash;

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
    
    socket.on('share',function(c,p){
        if (c==null) {
            toastr.error($.translate('You are not allowed to share')+' '+p.name,$.translate('Share'));
        } else {
            toastr.success($.translate('You have shared data of')+' '+p.name+': '+c,$.translate('Share'));
        }
    })
    
    
    document.getElementById('file-input').addEventListener('change', readSingleFile, false);
    
    $('.translate').translate();
    
    return {
        get_patients: get_patients
    }
}