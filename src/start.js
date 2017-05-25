
const 	map=require('./frontend/map'),
		login=require('./frontend/login'),
		signup=require('./frontend/signup'),
		translator=require('./frontend/translate'),
		doctor=require('./frontend/doctor-panel'),
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
		doctor(socket);
        map('#container','#themecss','#context-menu',socket,parseInt(m[1]));
    } else if (loc.match(/\/signup\//)!=null) {
		signup(socket);
	} else {
		login(socket);
	}
	
	
	
	
}
	
	
	
document.addEventListener('DOMContentLoaded', init);
