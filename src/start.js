
const 	map=require('./frontend/map'),
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
	var l=loc.match(/\/map\/([0-9]+)/);
	if (l!=null) {
		doctor(socket);
        map('#container','#themecss','#context-menu',socket,parseInt(l[1]));
    }
	
	
}
	
	
	
document.addEventListener('DOMContentLoaded', init);
