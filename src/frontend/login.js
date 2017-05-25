const  $ = require('jquery'),
        toastr = require('toastr');
        
require('../../public/css/toastr.min.css');

module.exports = function(socket) {

    $('.login-panel button.signin').click(function(e){
        var email=$('.login-panel .email').val().trim();
        var pass=$('.login-panel .password').val().trim();
        
        if (email.length==0 || pass.length==0) {
            toastr.error($.translate('Please submit login'), $.translate('Login error!'));
            
        }
        
    });
    
    $('.login-panel .translate').translate();
}