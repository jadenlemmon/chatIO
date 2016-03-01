chat.controller('whiteboardController', function($scope) {

    var canvas = this.__canvas = new fabric.Canvas('c', {
        isDrawingMode: true
    });

    canvas.setHeight(500);
    canvas.setWidth(800);

    fabric.Object.prototype.transparentCorners = false;

    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = '#000000';
        canvas.freeDrawingBrush.width = 10;
        canvas.freeDrawingBrush.shadowBlur = 0;
    }

    canvas.on('mouse:up', function(options) {
        var cUser = $scope.$parent.currentUser;
        //console.log(JSON.stringify(canvas));
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
        active: false
    };

    $scope.startWhiteboardSession = function() {
        var cUser = $scope.$parent.currentUser;
        socket.emit('startWhiteboardSession', {
            name: cUser,
            receive: $scope.whiteboard.user
        });
    };

    socket.on('startWhiteboard', function(msg) {
        $scope.whiteboard.request = true;
        $scope.whiteboard.user = msg.name;
        $scope.$apply();
    });

    socket.on('launchWhiteboard', function() {
        $scope.whiteboard.active = true;
        $scope.whiteboard.request = false;
        $scope.$apply();
    });

    socket.on('whiteboardSessionUpdate', function(data) {
        console.log(data.data);
        canvas.loadFromJSON(data.data);
    });

    //(function() {
    //    //var $ = function(id){return document.getElementById(id)};
    //
    //
    //
    //})();


});
