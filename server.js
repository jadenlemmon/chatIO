var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var assert = require('assert');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

//Holds active sockets and usernames
var connectedUsers = [],
    connectedUserNames = [];

io.on('connection', function(socket){

    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });

    socket.on('private message', function(msg){
        //send to receiving user
        console.log(connectedUserNames);
        for(var i = 0; i < connectedUserNames.length; i++) {
            if(connectedUserNames[i].name == msg.receive) {
                connectedUsers[i].emit('private message', msg);
            }
        }
    });

    socket.on('New User', function(msg){
        console.log(msg);
        connectedUserNames.push(msg);
        connectedUsers.push(socket);
        io.emit('activeUsers', connectedUserNames);
    });

    socket.on('disconnect', function() {

        for(var i = 0; i < connectedUsers.length; i++) {
            if(connectedUsers[i] == socket) {
                connectedUsers.splice(i,1);
                connectedUserNames.splice(i,1);
            }
        }

        io.emit('activeUsers', connectedUserNames);

        console.log('Got disconnect!');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});