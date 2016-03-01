var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('./db.js');
var AWS = require('aws-sdk');
require('./global.js');

AWS.config.region = 'us-west-2';
var s3 = new AWS.S3();

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

//Holds active sockets, usernames, whiteboards
var connectedUsers = [],
    connectedUserNames = [],
    whiteboards = [];

io.on('connection', function(socket){

    /**
     * Receive public chat message
     */
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
        mongo.insert(msg);
    });

    /**
     * Sends a request to a user to start a whiteboard session
     */
    socket.on('startWhiteboard', function(msg){
        for(var i = 0; i < connectedUserNames.length; i++) {
            if(connectedUserNames[i].name == msg.receive) {
                connectedUsers[i].emit('startWhiteboard', msg);
            }
        }
    });

    /**
     * Updates whiteboards in a whiteboard session
     */
    socket.on('whiteboardSessionUpdate', function(msg){
        for(var i = 0; i < connectedUserNames.length; i++) {
            if(connectedUserNames[i].name == msg.receive) {
                connectedUsers[i].emit('whiteboardSessionUpdate', msg);
            }
        }
    });

    /**
     * Starts a whiteboard session with users
     */
    socket.on('startWhiteboardSession', function(msg){
        whiteboards.push({
            user1: msg.name,
            user2: msg.receive
        });
        for(var i = 0; i < connectedUserNames.length; i++) {
            if(connectedUserNames[i].name == msg.receive || connectedUserNames[i].name == msg.name) {
                connectedUsers[i].emit('launchWhiteboard');
            }
        }
    });

    /**
     * Request for private chat messages
     */
    socket.on('pastMessages', function(msg){
        mongo.getPrivateChats(msg.queue,msg.cUser,function(data) {
            console.log(data);
            socket.emit('privateChats',{
                lobby: msg.queue,
                data: data
            });
        });
    });

    /**
     * Receive private chat message
     */
    socket.on('private message', function(msg){
        //send to receiving user
        console.log(connectedUserNames);
        for(var i = 0; i < connectedUserNames.length; i++) {
            if(connectedUserNames[i].name == msg.receive || connectedUserNames[i].name == msg.name) {
                connectedUsers[i].emit('private message', msg);
            }
        }
        mongo.insert(msg);
    });

    /**
     * Receive request of a new user
     */
    socket.on('New User', function(msg){
        console.log(msg);
        connectedUserNames.push(msg);
        connectedUsers.push(socket);
        mongo.getChats(function(data) {
            socket.emit('chats',data);
            io.emit('userJoined', msg.name);
        });
        io.emit('activeUsers', connectedUserNames);
    });

    /**
     * Request to kill a session
     */
    socket.on('kill', function(){
        socket.disconnect();
    });

    /**
     * Request to upload a file
     */
    socket.on('upload', function(file){
        var timestamp = Math.floor(new Date() / 1000);

        var params = {
            Bucket: 'chatio/uploads',
            Key: timestamp+'_'+file.fileName,
            Body: file.file,
            ACL: 'public-read'
        };

        s3.putObject(params, function (perr, pres) {
            if (perr) {
                console.log("Error uploading data: ", perr);
            } else {
                var msg = {
                    name: file.name,
                    img: 'yes',
                    text: 'https://s3-us-west-2.amazonaws.com/chatio/uploads/'+timestamp+'_'+file.fileName,
                    receive: file.receive,
                    type: file.type
                };
                if(file.type == 'public') {
                    io.emit('chat message', msg);
                }
                else {
                    for(var i = 0; i < connectedUserNames.length; i++) {
                        if(connectedUserNames[i].name == file.receive || connectedUserNames[i].name == file.name) {
                            connectedUsers[i].emit('private message', msg);
                        }
                    }
                }
                mongo.insert(msg);
            }
        });
    });

    /**
     * Run on socket disconnect
     */
    socket.on('disconnect', function() {
        for(var i = 0; i < connectedUsers.length; i++) {
            if(connectedUsers[i] == socket) {
                io.emit('userLeft', connectedUserNames[i].name);
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