
const 	map=require('./frontend/map'),
		socket_io = require('socket.io-client');
	
const init = function () {
	window.onerror = window.alert;
	var socket = socket_io.connect();
	map('#container','#themecss',socket);
}
	
	
	
document.addEventListener('DOMContentLoaded', init);
