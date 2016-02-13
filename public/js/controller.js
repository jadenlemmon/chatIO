var chat = angular.module('chat', ['ngAnimate']);

chat.controller('controller', function($scope) {

    $scope.chatStarted = false;
    $scope.currentUser = false;
    $scope.messageToSend = '';
    $scope.nameError = false;
    $scope.yourName = '';
    $scope.connectedUsers = [];

    var socket = io();

    $scope.messages = [];

    //$scope.messages = (localStorage.getItem('messages')!==null) ? JSON.parse(localStorage.getItem('messages')) : [];

    $scope.startChat = function(name) {
        $scope.yourName = name;
        if($scope.yourName.length > 0) {
            $scope.currentUser = name;
            $scope.chatStarted = true;
            socket.emit('New User', name);
        }
        else {
            $scope.nameError = true;
        }
    };

    $scope.sendMessage = function() {
        if($scope.messageToSend.length <= 0) return;
        socket.emit('chat message', {
            name: $scope.currentUser,
            text: $scope.messageToSend
        });
        $scope.messageToSend = '';
    };

    socket.on('chat message', function(msg){
        console.log(msg);
        $scope.messages.push({
            name: msg.name,
            text: msg.text
        });
        $scope.$apply();
        //localStorage.setItem('messages', JSON.stringify($scope.messages));
    });
    socket.on('New Connection', function(msg) {
        console.log(msg);
        $scope.connectedUsers.push(msg);
        $scope.$apply();
    });

    //socket.on('connect', function () { // TIP: you can avoid listening on `connect` and listen on events directly too!
    //    socket.emit('New User', $scope.yourName);
    //});

}).directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter, {'event': event});
                });
                event.preventDefault();
            }
        });
    };
});