
const 	map=require('./frontend/map'),
		socket_io = require('socket.io-client');
	
const init = function () {
	window.onerror = window.alert;
	var socket = socket_io.connect();
	
	socket.emit('time',(new Date).getTime());
	socket.on('cookie',function(name,value){
		document.cookie=name+'='+value+'; path=/';
	});
	var loc=window.location+'';
	var l=loc.match(/\/map\/([0-9]+)/);
	if (l!=null) {
        map('#container','#themecss',socket,parseInt(l[1]));
    }
	
	
}
	
	
	
document.addEventListener('DOMContentLoaded', init);
