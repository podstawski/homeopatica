const  $ = require('jquery'),
        toastr = require('toastr');
        
require('../../public/css/toastr.min.css');

module.exports = function(socket) {

    $('.signup-panel button.signup').click(function(e){
        var email=$('.signup-panel .email').val().trim();
        var pass=$('.signup-panel .password').val().trim();
        
        if (email.length==0 || pass.length==0) {
            toastr.error($.translate('Please submit signup'), $.translate('Login error!'));
            
        }
        
    });
    
    $('.signup-panel .translate').translate();
    document.title=$.translate(document.title);
}