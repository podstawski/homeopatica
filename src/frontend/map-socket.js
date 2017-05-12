module.exports = function (mapModel,socket,eid) {

    socket.emit('examination',eid);
    
    socket.on('examination',function(examination) {
        console.log(examination);
        var map={}; 
    });
}