'use strict';

(function(angular) {
    function whiteboardController($scope, $element, $attrs, socket) {
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

        function sendCanvasUpdate() {
            var cUser = $scope.$parent.currentUser;
            socket.emit('whiteboardSessionUpdate', {
                name: cUser,
                receive: $scope.whiteboard.user,
                data: JSON.stringify(canvas)
            });
        }

        canvas.on('mouse:up', function(options) {
            sendCanvasUpdate();
        });

        $scope.clearCanvas = function() {
            canvas.clear();
            sendCanvasUpdate();
        };

        //handles request for a whiteboard session
        $scope.whiteboard = {
            request: false,
            user: false,
            active: false,
            awaitingResponse: false,
            remaining: 15
        };

        $scope.$on('whiteboard', function(e,msg) {
            $scope.whiteboard.awaitingResponse = true;
            socket.emit('startWhiteboard', msg);
        });

        $scope.startWhiteboardSession = function() {
            var cUser = $scope.$parent.currentUser;
            socket.emit('startWhiteboardSession', {
                name: cUser,
                receive: $scope.whiteboard.user
            });
        };

        $scope.closeWhiteboard = function() {
            var cUser = $scope.$parent.currentUser;
            socket.emit('closeWhiteboard', {
                name: cUser,
                receive: $scope.whiteboard.user
            });
        };

        socket.on('startWhiteboard', function(msg) {
            $scope.whiteboard.request = true;
            $scope.whiteboard.user = msg.name;
        });

        socket.on('whiteboardRemaining', function(msg) {
            $scope.whiteboard.remaining = msg;
        });

        socket.on('closeWhiteboard', function() {
            $scope.whiteboard.active = false;
            $scope.whiteboard.user = false;
            $scope.whiteboard.awaitingResponse = false;
            $scope.whiteboard.request = false;
        });

        socket.on('launchWhiteboard', function(msg) {
            $scope.whiteboard.awaitingResponse = false;
            $scope.whiteboard.active = true;
            $scope.whiteboard.request = false;
            if(!$scope.whiteboard.user) {
                $scope.whiteboard.user = msg.name;
            }
        });

        socket.on('whiteboardSessionUpdate', function(data) {
            canvas.loadFromJSON(data.data, canvas.renderAll.bind(canvas));
        });
    }

    angular.module('whiteboardcomponent', ['socketservice']).component('whiteboardcomponent',{
        controller: whiteboardController,
        bindings: {},
        template: '<div id="overlay" ng-show="whiteboard.request || whiteboard.active || whiteboard.awaitingResponse">' +
        '<div id="response" ng-if="whiteboard.awaitingResponse">' +
        '<h2>Awaiting Response...</h2>' +
        '<div class="remaining">' +
        '{{whiteboard.remaining}}' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="modal" tabindex="-1" role="dialog" ng-show="whiteboard.request">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<!--<button type="button" class="close" ng-click="closeModal()" aria-label="Close"><span aria-hidden="true">&times;</span></button>-->' +
        '<h4 class="modal-title pull-left">Whiteboard Request</h4>' +
        '<div class="pull-right">' +
        '{{whiteboard.remaining}}' +
        '</div>' +
        '</div>' +
        '<div class="modal-body">' +
        '<p>{{whiteboard.user}} has requested to start a whiteboard session with you.</p>' +
        '<p>Would you like to accept?</p>' +
        '<button class="btn btn-default green" ng-click="startWhiteboardSession()">Yes</button>' +
        '<button class="btn btn-default red" ng-click="closeWhiteboard()">No</button>' +
        '</div>' +
        '<div class="clearfix"></div>' +
        '<div class="modal-footer">' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="modal" tabindex="-1" role="dialog" ng-show="whiteboard.active" id="whiteboardActive">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<h4 class="modal-title pull-left"><i class="fa fa-pencil-square"></i> Draw below</h4>' +
        '<button class="btn btn-default pull-right" ng-click="closeWhiteboard()"><i class="fa fa-times-circle"></i> Close Session</button>' +
        '<button class="btn btn-default pull-right" ng-click="clearCanvas()"><i class="fa fa-eraser"></i> Clear Canvas</button>' +
        '</div>' +
        '<div class="modal-body" id="drawContain">' +
        '<canvas id="c"></canvas>' +
        '</div>' +
        '<div class="clearfix"></div>' +
        '<div class="modal-footer">' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    });
})(angular);