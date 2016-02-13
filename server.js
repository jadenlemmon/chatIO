var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var assert = require('assert');
//var path = require('path');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

var clients = [],
    sequence = 1;

io.on('connection', function(socket){
    clients.push(socket);
    console.log(socket.id);
    socket.emit('news', { hello: 'world' });
    //io.to(socket.id).emit('hey');
    //io.sockets.connected[socket.id].emit('particular User', {data: "Event response by particular user "});

    //console.log(socket);
    //io.emit('connection', 'new connection');
    console.log('new connection');

    socket.on('chat message', function(msg){
        //console.log(msg);
        io.emit('chat message', msg);
    });
    socket.on('New User', function(msg){
        //socket.emit('New Connection', msg);
        console.log(msg);
        io.emit('New Connection', msg);
    });
});

// Every 1 second, sends a message to a random client:
//setInterval(function() {
//    var randomClient;
//    if (clients.length > 0) {
//        randomClient = Math.floor(Math.random() * clients.length);
//        clients[randomClient].emit('foo', sequence++);
//    }
//}, 1000);

http.listen(3000, function(){
    console.log('listening on *:3000');
});