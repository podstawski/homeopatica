
const 	map=require('./frontend/map'),
		login=require('./frontend/login'),
		signup=require('./frontend/signup'),
		translator=require('./frontend/translate'),
		doctor_panel=require('./frontend/doctor-panel'),
		doctor=require('./frontend/doctor'),
		socket_io = require('socket.io-client'),
		jQuery=require('jquery');
	
const init = function () {
	window.onerror = window.alert;
	var socket = socket_io.connect({'forceNew':true });
	socket.emit('time',(new Date).getTime());
	socket.on('cookie',function(name,value){
		document.cookie=name+'='+value+'; path=/';
	});
	
	translator(jQuery);
	
	var loc=window.location+'';
	var m=loc.match(/\/map\/([0-9]+)/);

	if (m!=null) {
		doctor_panel(socket);
        map('#container','#themecss','#context-menu',socket,parseInt(m[1]));
    } else if (loc.match(/\/signup\//)!=null) {
		signup(socket);
	} else if (loc.match(/\/doctor\//)!=null) {
		doctor(socket).get_patients();
	} else {
		login(socket);
	}
	
	jQuery('.logout').click(function(e){
        socket.emit('logout');
        location.href='/';
    });
	
	
}
	
	
	
document.addEventListener('DOMContentLoaded', init);
