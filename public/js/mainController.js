var socket;

var chat = angular.module('chat', ['ngAnimate','luegg.directives', 'ngCookies', 'ngFileUpload']);

chat.controller('mainController', function($scope,$window,$cookies,Upload) {

    //Handle resize for layout changes
    var w = angular.element($window);
    w.bind('resize', function () {
        $scope.windowSize = screen.width;
        $scope.isMobile = screen.width < 640;
        console.log(screen.width);
        $scope.$apply();
    });

    function playAudio() {
        if (focused === false) {
            var audio = new Audio('../sounds/Sparkle Pop Bonus.wav');
            audio.play();
        }
    }

    //Current window size
    $scope.windowSize = screen.width;

    //Are we on mobile sizing?
    $scope.isMobile = screen.width < 640;

    $scope.activeIcon = 'rocket';
    $scope.chatStarted = false;
    $scope.currentUser = false;
    $scope.messageToSend = '';
    $scope.nameError = false;
    $scope.yourName = '';
    $scope.connectedUsers = [];
    $scope.activeChatWindow = 'Main Lobby';
    $scope.pm = false;
    $scope.toggleMobile = false;

    //img uploading loader
    $scope.imgUploading = false;

    $scope.messages = {
        'Main Lobby': []
    };

    $scope.toggleMobileNav = function() {
        $scope.toggleMobile = $scope.toggleMobile ? false : true;
    };

    $scope.setActiveIcon = function(icon) {
        $scope.activeIcon = icon;
    };

    $scope.startChat = function(name,data) {
        socket = io();

        socket.on('activeUsers', function(msg) {
            $scope.connectedUsers = msg;
            $scope.$apply();
        });

        socket.on('userJoined', function(msg) {
            if($scope.currentUser) {
                $scope.messages['Main Lobby'].push({
                    name: 'User Joined',
                    text: msg
                });
            }
        });

        socket.on('chats', function(msg) {
            $scope.messages['Main Lobby'] = msg;
            $scope.$apply();
        });

        socket.on('privateChats', function(msg) {
            $scope.messages[msg.lobby] = msg.data;
            $scope.$apply();
        });

        socket.on('userLeft', function(msg) {
            if($scope.currentUser) {
                $scope.messages['Main Lobby'].push({
                    name: 'User Left',
                    text: msg
                });
            }
        });

        socket.on('chat message', function(msg){
            $scope.messages['Main Lobby'].push({
                name: msg.name,
                text: msg.text,
                img: msg.img
            });
            if($scope.imgUploading && msg.img == 'yes') {
                $scope.imgUploading = false;
            }
            $scope.$apply();

            playAudio();
        });

        socket.on('private message', function(msg){
            var cUser = $scope.currentUser;
            var queue = msg.name == cUser ? msg.receive : msg.name;
            if(!$scope.messages[queue]) {
                $scope.messages[queue] = [];
            }
            $scope.messages[queue].push({
                name: msg.name,
                text: msg.text,
                img: msg.img
            });

            if($scope.activeChatWindow !== msg.name) {
                for(var i = 0; i < $scope.connectedUsers.length; i++) {
                    if($scope.connectedUsers[i].name == msg.name) {
                        $scope.connectedUsers[i].unRead++;
                    }
                }
            }

            if($scope.imgUploading && msg.img == 'yes') {
                $scope.imgUploading = false;
            }
            $scope.$apply();

            playAudio();
        });

        $scope.yourName = name;
        if($scope.yourName.length > 0) {
            $scope.currentUser = name;
            $scope.chatStarted = true;
            if(!data) {
                data = {
                    name: name,
                    icon: $scope.activeIcon,
                    unRead: 0
                }
            }
            socket.emit('New User', data);
            $cookies.putObject('chatIO', data);
        }
        else {
            $scope.nameError = true;
        }
    };

    $scope.leaveChat = function() {
        socket.emit('kill');
        $scope.chatStarted = false;
        $cookies.remove('chatIO');
    };

    $scope.sendMessage = function() {
        var queue = $scope.activeChatWindow;
        var message = $scope.messageToSend;
        var cUser = $scope.currentUser;
        if(message.length <= 0) return;
        if(queue == 'Main Lobby') {
            socket.emit('chat message', {
                name: cUser,
                text: message,
                img: 'no',
                type: 'public'
            });
        }
        else {
            socket.emit('private message', {
                name: cUser,
                text: message,
                receive: queue,
                type: 'private'
            });
        }
        $scope.messageToSend = '';
    };

    $scope.chatWindow = function(chat,type) {
        var cUser = $scope.currentUser;
        $scope.pm = type;
        $scope.activeChatWindow = chat;
        if(type) {
            for(var i = 0; i < $scope.connectedUsers.length; i++) {
                if($scope.connectedUsers[i].name == chat) {
                    $scope.connectedUsers[i].unRead = 0;
                }
            }
            //make a request for past messages
            socket.emit('pastMessages', {
                queue: chat,
                cUser: cUser
            });
        }
        $scope.toggleMobileNav();
    };

    // upload on file select or drop
    $scope.uploadFile = function (file) {
        $scope.imgUploading = true;
        var queue = $scope.activeChatWindow;
        var cUser = $scope.currentUser;
        var type = 'private';
        if(queue == 'Main Lobby') {
            type = 'public';
        }
        socket.emit('upload', {
            name: cUser,
            file: file,
            fileName: file.name,
            receive: queue,
            type: type
        });
    };

    $scope.startWhiteboard = function() {
        $scope.$broadcast('whiteboard');
    };

    if($cookies.getObject('chatIO')) {
        var data = $cookies.getObject('chatIO');
        $scope.startChat(data.name,data);
    }

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
}).directive('animateOnChange', function($timeout) {
    return function(scope, element, attr) {
        scope.$watch(attr.animateOnChange, function(nv,ov) {
            if (nv!=ov) {
                element.addClass('changed');
                $timeout(function() {
                    element.removeClass('changed');
                }, 1000);
            }
        });
    };
});

var focused = true;

window.onfocus = window.onblur = function(e) {
    focused = (e || event).type === "focus";
}