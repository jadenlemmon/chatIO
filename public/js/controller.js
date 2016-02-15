var chat = angular.module('chat', ['ngAnimate','luegg.directives']);

chat.controller('controller', function($scope,$window) {

    //Handle resize for layout changes
    var w = angular.element($window);
    w.bind('resize', function () {
        $scope.windowSize = screen.width;
        $scope.isMobile = screen.width < 640;
        $scope.$apply();
    });

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

    var socket = io();

    $scope.messages = {
        'Main Lobby': []
    };

    $scope.toggleMobileNav = function() {
        $scope.toggleMobile = $scope.toggleMobile ? false : true;
    };

    $scope.setActiveIcon = function(icon) {
        $scope.activeIcon = icon;
    };

    $scope.startChat = function(name) {
        $scope.yourName = name;
        if($scope.yourName.length > 0) {
            $scope.currentUser = name;
            $scope.chatStarted = true;
            socket.emit('New User', {
                name: name,
                icon: $scope.activeIcon,
                unRead: 0
            });
        }
        else {
            $scope.nameError = true;
        }
    };

    $scope.sendMessage = function() {
        var queue = $scope.activeChatWindow;
        var message = $scope.messageToSend;
        var cUser = $scope.currentUser;
        if(message.length <= 0) return;
        if(queue == 'Main Lobby') {
            socket.emit('chat message', {
                name: cUser,
                text: message
            });
        }
        else {
            socket.emit('private message', {
                name: cUser,
                text: message,
                receive: queue
            });
            if(!$scope.messages[queue]) {
                $scope.messages[queue] = [];
            }
            $scope.messages[queue].push({
                name: cUser,
                text: message
            });
        }
        $scope.messageToSend = '';
    };

    $scope.chatWindow = function(chat,type) {
        $scope.pm = type;
        $scope.activeChatWindow = chat;
        if(type) {
            for(var i = 0; i < $scope.connectedUsers.length; i++) {
                if($scope.connectedUsers[i].name == chat) {
                    $scope.connectedUsers[i].unRead = 0;
                }
            }
        }
        $scope.toggleMobileNav();
    };

    socket.on('chat message', function(msg){
        $scope.messages['Main Lobby'].push({
            name: msg.name,
            text: msg.text
        });
        $scope.$apply();
    });

    socket.on('private message', function(msg){
        if(!$scope.messages[msg.name]) {
            $scope.messages[msg.name] = [];
        }
        $scope.messages[msg.name].push({
            name: msg.name,
            text: msg.text
        });

        if($scope.activeChatWindow !== msg.name) {
            for(var i = 0; i < $scope.connectedUsers.length; i++) {
                if($scope.connectedUsers[i].name == msg.name) {
                    $scope.connectedUsers[i].unRead++;
                }
            }
        }
        $scope.$apply();
    });

    socket.on('activeUsers', function(msg) {
        $scope.connectedUsers = msg;
        $scope.$apply();
    });

    socket.on('userJoined', function(msg) {
        $scope.messages['Main Lobby'].push({
            name: 'User Joined',
            text: msg
        });
        $scope.$apply();
    });

    socket.on('userLeft', function(msg) {
        $scope.messages['Main Lobby'].push({
            name: 'User Left',
            text: msg
        });
        $scope.$apply();
    });

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