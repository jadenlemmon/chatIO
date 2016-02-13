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

io.on('connection', function(socket){
    //console.log(socket);
    //io.emit('connection', 'new connection');
    console.log('new connection');

    socket.on('chat message', function(msg){
        //console.log(msg);
        io.emit('chat message', msg);
    });
    socket.on('New User', function(msg){
        socket.emit('New Connection', msg);
        console.log(msg);
        //io.emit('chat message', msg);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});