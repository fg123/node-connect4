// client.js

var socket;
var boardState = clearBoard();

// Drawing
var canvas;

var padding = 20;
var boxSize = 64;
var pieceSize = 54;
var gridWidth = 7; // 7 cols
var gridHeight = 6; // 6 rows
var gameHeight = gridHeight * boxSize + 2 * padding;
var gameWidth = gridWidth * boxSize + 2 * padding;
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
            var leftOffset = $(".gameCanvas").offset().left + padding;
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
	setHeaderText("Waiting for server...");
});

function setHeaderText(s) { 
	$(".header").html(s);
}

function drawBoard() {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 4;
    
	var leftX = (gameWidth - (gridWidth * boxSize)) / 2;
	ctx.fillStyle = "#1750aa";
	ctx.fillRect(leftX, gameHeight - (gridHeight * boxSize) - padding, gameWidth - leftX - padding, gameHeight - padding * 2);
	ctx.beginPath();
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
    ctx.strokeStyle = "#0d326b";
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
       	ctx.clearRect(0, 0, canvas.width, canvas.height);
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
		var col = parseInt(id.replace(/\D/g, ''));
		if (boardState[col].length < gridHeight) {
			socket.emit("placePiece", col);
			isCurrentTurn = false;
			setHeaderText("Waiting for opponent...");
		}	
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
		setHeaderText("Connected to server. Waiting for player...");
    });

    socket.on("newBoard", function(board) {
        console.log('new board');
        boardState = board;
        drawBoard();
    });

    socket.on("turn", function() {
        console.log("my turn");
		isCurrentTurn = true;
		setHeaderText("Your turn!");
    })

	socket.on("winner", function (winner) {
		if (player == winner) {
			setHeaderText("You've won! Game will reset soon...");
		}
		else if (player != 0) { 
			setHeaderText("You lost! Game will reset soon...");
		}
		else {
			setHeaderText("Player " + winner + " won! Game will reset soon...");
		}
    });

	socket.on("reset", function () {
		boardState = clearBoard();
		drawBoard();
		setHeaderText("Waiting to start...");
	});
    socket.on("errorMsg", function(msg) {
        console.log(msg);
    });

    socket.emit("start");
}

function clearBoard() {
	var res = [];
	for (var i = 0; i < gridWidth; i++) { 
		res.push([]);
	}
	return res;
}