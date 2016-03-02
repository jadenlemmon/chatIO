chat.controller('whiteboardController', function($scope) {

    var canvas = new fabric.Canvas('c', {
        isDrawingMode: true
    });

    canvas.setHeight(document.getElementById('drawContain').clientHeight-32);
    canvas.setWidth(document.getElementById('drawContain').clientWidth-32);

    fabric.Object.prototype.transparentCorners = false;

    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = '#000000';
        canvas.freeDrawingBrush.width = 10;
        canvas.freeDrawingBrush.shadowBlur = 0;
    }

    canvas.on('mouse:up', function(options) {
        var cUser = $scope.$parent.currentUser;
        socket.emit('whiteboardSessionUpdate', {
            name: cUser,
            receive: $scope.whiteboard.user,
            data: JSON.stringify(canvas)
        });
    });

    //handles request for a whiteboard session
    $scope.whiteboard = {
        request: false,
        user: false,
        active: false,
        awaitingResponse: false,
        remaining: 15
    };

    $scope.$on('whiteboard', function(e) {
        $scope.whiteboard.awaitingResponse = true;
        console.log($scope.whiteboard);
        var cUser = $scope.currentUser;
        var queue = $scope.activeChatWindow;
        socket.emit('startWhiteboard', {
            name: cUser,
            receive: queue
        });
    });

    $scope.startWhiteboardSession = function() {
        var cUser = $scope.$parent.currentUser;
        socket.emit('startWhiteboardSession', {
            name: cUser,
            receive: $scope.whiteboard.user
        });
    };

    $scope.closeWhiteboard = function() {
        var cUser = $scope.currentUser;
        socket.emit('closeWhiteboard', {
            name: cUser,
            receive: $scope.whiteboard.user
        });
    };

    socket.on('startWhiteboard', function(msg) {
        $scope.whiteboard.request = true;
        $scope.whiteboard.user = msg.name;
        $scope.$apply();
    });

    socket.on('whiteboardRemaining', function(msg) {
        $scope.whiteboard.remaining = msg;
        $scope.$apply();
    });

    socket.on('closeWhiteboard', function() {
        $scope.whiteboard.active = false;
        $scope.whiteboard.user = false;
        $scope.whiteboard.awaitingResponse = false;
        $scope.whiteboard.request = false;
        $scope.$apply();
    });

    socket.on('launchWhiteboard', function(msg) {
        $scope.whiteboard.awaitingResponse = false;
        $scope.whiteboard.active = true;
        $scope.whiteboard.request = false;
        if(!$scope.whiteboard.user) {
            $scope.whiteboard.user = msg.name;
        }
        $scope.$apply();
    });

    socket.on('whiteboardSessionUpdate', function(data) {
        canvas.loadFromJSON(data.data, canvas.renderAll.bind(canvas));
    });
});
