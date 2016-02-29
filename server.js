var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('./db.js');
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
AWS.config.update({
    accessKeyId: 'AKIAJXKJK62WS5WUQL7A',
    secretAccessKey: '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'
});

var s3 = new AWS.S3();

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
        mongo.insert(msg);
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
        mongo.getChats(function(data) {
            socket.emit('chats',data);
            io.emit('userJoined', msg.name);
        });
        io.emit('activeUsers', connectedUserNames);
    });

    socket.on('kill', function(){
        socket.disconnect();
    });

    socket.on('upload', function(file){
        var params = {
            Bucket: 'chatio/uploads',
            Key: file.name,
            Body: file.file
        };

        s3.putObject(params, function (perr, pres) {
            if (perr) {
                console.log("Error uploading data: ", perr);
            } else {
                var params = {Bucket: 'chatio/uploads', Key: file.name};
                s3.getSignedUrl('getObject', params, function (err, url) {
                    console.log("The URL is", url);
                    io.emit('chat message', {
                        name: 'image',
                        img: 'yes',
                        text: url
                    });
                });
                //mongo.insert(msg);
                console.log("Successfully uploaded data to myBucket/myKey");
            }
        });
    });

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