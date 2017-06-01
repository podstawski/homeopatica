const  $ = require('jquery'),
        toastr = require('toastr');
        
require('../../public/css/toastr.min.css');

module.exports = function(socket) {

    $('.login-panel button.signin').click(function(e){
        var email=$('.login-panel .email').val().trim();
        var pass=$('.login-panel .password').val().trim();
        
        if (email.length==0 || pass.length==0) {
            toastr.error($.translate('Please submit login'), $.translate('Login error!'));
            return;
        }
        socket.emit('signin',email,pass);
        
    });
    
    socket.on('signin',function(redir){
        if (redir===null) {
            toastr.error($.translate('Email or password incorrect'), $.translate('Login error!'));
        }
        else if (redir===false) {
            toastr.warning($.translate('Your email was not activated, check your mailbox'), $.translate('Login error!'));
        } else {
            $('body').fadeOut(750,function(){
                location.href=redir;
            });
        }
    });
    
    $('.login-panel .translate').translate();
    document.title=$.translate(document.title);
}