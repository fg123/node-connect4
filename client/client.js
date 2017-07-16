// client.js

var socket;
var boardState = [[], [], [], [], [], [], []];

// Drawing
var canvas;
var gameHeight = 480;
var gameWidth = 854;
var boxSize = 64;
var pieceSize = 54;
var gridWidth = 7; // 7 cols
var gridHeight = 6; // 6 rows
var isCurrentTurn = false;
var player = 0;

// 2 = X, 1 = O
// [[2, 2, 1], [], [1], [2], [1], [], [2, 1]]

// O
// X      O
// X  OXO X

// to start connection with server:

$(document).ready(function() {
    canvas = $("#canvas")[0];
    canvas.width = (gameWidth);
    canvas.height = (gameHeight);

    // Init Squares
    drawBoard();

    // Setup connection
    setupSocket();

    $(".gameWrapper").mousemove(function (event) {
        if (isCurrentTurn) {
            var leftOffset = $(".gameCanvas").offset().left;
            var mouse = event.pageX - leftOffset;
            var index = parseInt((event.pageX - leftOffset) / boxSize);
            for (var i = 0; i < gridWidth; i++) {
                if (index != i) {
                    $("#u" + i + " canvas").hide();
                }
                else {
                    $("#u" + i + " canvas").show();
                }
            }
        }
    });

});

function drawBoard() {
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFF";

    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    ctx.beginPath();
    var leftX = (gameWidth - (gridWidth * boxSize)) / 2;
    var padding = 20;
    // Draw Boxes
    for (var i = 0; i < gridWidth + 1; i++) {
        // Verticals
        ctx.moveTo(leftX + (i * boxSize), gameHeight - padding);
        ctx.lineTo(leftX + (i * boxSize), gameHeight - (gridHeight * boxSize) - padding);
    }
    for (var i = 0; i < gridHeight + 1; i++) {
        // Horizontals
        ctx.moveTo(leftX, gameHeight - (i * boxSize) - padding);
        ctx.lineTo(gameWidth - leftX, gameHeight - (i * boxSize) - padding);
    }
    ctx.strokeStyle = "black";
    ctx.stroke();
    // Draw the Circles
    for (var col = 0; col < boardState.length; col++) {
        for (var row = 0; row < boardState[col].length; row++) {
            ctx.beginPath();
            ctx.arc(leftX + ((col + 0.5) * boxSize), gameHeight - ((row + 0.5) * boxSize) - padding, pieceSize / 2, 0, 2 * Math.PI);
            if (boardState[col][row] == 1) {
                ctx.fillStyle = "red";
            }
            else {
                ctx.fillStyle = "yellow";
            }
            ctx.fill();
        }
    }
}

function initUserControl() {
    console.log('user');
    // Init User Control after Sockets
    for (var i = 0; i < gridWidth; i++) {
        var newDiv = $("<div id='u" + i + "'><canvas height='" + pieceSize + "' width='" + pieceSize + "'></canvas></div>");
        newDiv.height(boxSize);
        newDiv.width(boxSize);
        newDiv.click(function () {
            handlePushPiece($(this).attr("id"));
        });
        $(".userControl").append(newDiv);
        var ctx = newDiv.find("canvas")[0].getContext("2d");
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, pieceSize, pieceSize);
        ctx.beginPath();
        ctx.arc(pieceSize / 2, pieceSize / 2, pieceSize / 2, 0, 2 * Math.PI);
        if (player == 1) {
            ctx.fillStyle = "red";
        }
        else {
            ctx.fillStyle = "yellow";
        }
        ctx.fill();
    }
}

function handlePushPiece(id) {
    console.log('click', isCurrentTurn);
    if (isCurrentTurn) {
        socket.emit("placePiece", parseInt(id.replace(/\D/g,'')));
        isCurrentTurn = false;
    }
}

function setupSocket() {
    if(!socket) {
        socket = io();
    }

    socket.on("connected", function(role) {
        if(role === 1) {
            player = role;
        }
        else if(role === 2) {
            player = role;
        }
        else {
            player = -1;
        }
        initUserControl();
    });

    socket.on("newBoard", function(board) {
        console.log('new board');
        boardState = board;
        drawBoard();
    });

    socket.on("turn", function() {
        console.log("my turn");
        isCurrentTurn = true;
    })

    socket.on("winner", function(player) {
    });

    socket.on("errorMsg", function(msg) {
        console.log(msg);
    });

    socket.emit("start");
}
