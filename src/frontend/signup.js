const  $ = require('jquery'),
        toastr = require('toastr');
        
require('../../public/css/toastr.min.css');

module.exports = function(socket) {

    $('.signup-panel button.signup').click(function(e){
        var email=$('.signup-panel .email').val().trim().toLowerCase();
        var pass=$('.signup-panel .password').val().trim();
        var pass2=$('.signup-panel .password2').val().trim();
        var homeopath=$('.signup-panel #homeopath').prop('checked');
        
        if (email.length==0) {
            toastr.error($.translate('Please submit your e-mail'), $.translate('Signup error!'));
            return;
        }
        
        if (!email.match(/[^@]+@[^@]+\.[^@]+/)) {
            toastr.error($.translate('The email seems to be invalid'), $.translate('Signup error!'));
            return;
        }
        
        if (pass.length==0) {
            toastr.error($.translate('Please type your new password'), $.translate('Signup error!'));
            return;
        }
        if (pass!=pass2) {
            toastr.error($.translate('The password does not match the confirm password'), $.translate('Signup error!'));
            return;
        }
        
        socket.emit('signup',{
            email: email,
            password: pass,
            doctor: homeopath?1:0
        },navigator.language || navigator.userLanguage);
        
    });
    
    
    socket.on('signup',function(result){
        switch (result) {
            case 'email_exists':
                toastr.error($.translate('Email exists'), $.translate('Signup error!'));
                break;
        }
    });
    
    $('.signup-panel .translate').translate();
    document.title=$.translate(document.title);
}