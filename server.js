var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('./db.js');
var AWS = require('aws-sdk');
require('./global.js');

//var crypto = require('crypto'),
//    algorithm = 'sha1',
//    password = process.env.GITHUB_DEPLOY_SECRET;

var crypto = require('crypto')
    , shasum = crypto.createHash('sha1');
shasum.update(process.env.GITHUB_DEPLOY_SECRET);
console.log(shasum.digest('hex'));

function encrypt(text){
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}

function signBlob (key) {
    return 'sha1=' + crypto.createHmac('sha1', key).digest('hex');
}

//var githubhook = require('githubhook');
//
//var github = githubhook({
//    secret: process.env.GITHUB_DEPLOY_SECRET,
//    path: '/deploy'
//});
//
//github.listen();
//
//github.on('*', function (event, repo, ref, data) {
//    console.log('hello');
//    console.log(data);
//});
//
//github.on('push', function (repo, ref, data) {
//    console.log('hello');
//    console.log(data);
//});

//used to run shell scripts
var sys = require('sys');
var exec = require('child_process').exec;

AWS.config.region = 'us-west-2';
var s3 = new AWS.S3();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.post('/deploy', function(req, res){
    var branch = req.body.ref;
    var secret = req.headers['x-hub-signature'];

    console.log(secret);

    //if(branch == 'refs/heads/master') {
    //    //console.log(req.body.ref);
    //    console.log('deploy');
    //    res.status(400).send('Success');
    //    //console.log(res);
    //    var deploy = exec('sh deploy.sh');
    //    deploy.stdout.on('data',function(data){
    //        console.log(data); // process output will be displayed here
    //    });
    //    deploy.stderr.on('data',function(data){
    //        console.log(data); // process error output will be displayed here
    //    });
    //}
});

//Holds active sockets, usernames, whiteboards
var connectedUsers = [],
    connectedUserNames = [],
    whiteboards = [],
    remaining;

function sendByUsername(name1,name2,callback) {
    for(var i = 0; i < connectedUserNames.length; i++) {
        if(connectedUserNames[i].name == name1 || connectedUserNames[i].name == name2) {
            callback(connectedUsers[i]);
        }
    }
}

io.on('connection', function(socket){

    /**
     * Receive public chat message
     */
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
        if(msg.text == 'secret message') {
            io.emit('chat message', {
                text: 'Hello, you have awakened the bot!',
                name: 'bot',
                img: 'no'
            });
            setTimeout(function() {
                io.emit('chat message', {
                    text: 'What do you want?',
                    name: 'bot',
                    img: 'no'
                });
            },4000);
        }
        mongo.insert(msg);
    });

    /**
     * Close whiteboard session
     */
    socket.on('closeWhiteboard', function(msg){
        sendByUsername(msg.receive,msg.name,function(user) {
            user.emit('closeWhiteboard');
        });
    });

    /**
     * Sends a request to a user to start a whiteboard session
     */
    socket.on('startWhiteboard', function(msg){
        sendByUsername(msg.receive,msg.receive,function(user) {
            user.emit('startWhiteboard', msg);
        });
        var number = 15;
        remaining = setInterval(function(){
            sendByUsername(msg.receive,msg.name,function(user) {
                user.emit('whiteboardRemaining', number);
            });
            //socket.emit('whiteboardRemaining', number);
            number--;
            if(number < 0) {
                sendByUsername(msg.receive,msg.name,function(user) {
                    user.emit('closeWhiteboard');
                });
                //socket.emit('closeWhiteboard');
                clearInterval(remaining);
            }
        },1000);
    });

    /**
     * Updates whiteboards in a whiteboard session
     */
    socket.on('whiteboardSessionUpdate', function(msg){
        sendByUsername(msg.receive,msg.name,function(user) {
            user.emit('whiteboardSessionUpdate', msg);
        });
    });

    /**
     * Starts a whiteboard session with users
     */
    socket.on('startWhiteboardSession', function(msg){
        clearInterval(remaining);
        whiteboards.push({
            user1: msg.name,
            user2: msg.receive
        });
        sendByUsername(msg.receive,msg.name,function(user) {
            user.emit('launchWhiteboard', msg);
        });
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
        sendByUsername(msg.receive,msg.name,function(user) {
            user.emit('private message', msg);
        });
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
                    sendByUsername(file.receive,file.name,function(user) {
                        user.emit('private message', msg);
                    });
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