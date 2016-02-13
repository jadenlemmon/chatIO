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

//Holds active sockets and usernames
var connectedUsers = [],
    connectedUserNames = [];

io.on('connection', function(socket){

    console.log(socket.id);
    //io.to(socket.id).emit('hey');
    //io.sockets.connected[socket.id].emit('particular User', {data: "Event response by particular user "});

    //console.log(socket);
    //io.emit('connection', 'new connection');
    console.log('new connection');

    socket.on('chat message', function(msg){
        //console.log(msg);
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
        //var i = connectedUserNames.indexOf(msg.receive);
        //connectedUsers[i].emit('private message', msg);

        //send to sending user
        //i = connectedUserNames.indexOf(msg.name);
        //connectedUsers[i].emit('private message', msg);
    });

    socket.on('New User', function(msg){
        console.log(msg);
        connectedUserNames.push(msg);
        connectedUsers.push(socket);
        //connectedUsers[msg] = socket;
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