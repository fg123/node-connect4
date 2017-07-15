// server.js

var express = require("express");
var app     = express();
var comp    = require("compression");
var http    = require("http").createServer(app);
var io      = require("socket.io").listen(http);

var players = [];
var spectators = {};
var boardState = [[], [], [], [], [], [], []]; //7 columns
var maxHeight = 6;
var currTurn = 0;

function checkWin() {
  // Columns
  for(var i = 0; i < boardState.length; ++i) {
    var colStr = boardState[i].toString();
    if(colStr.indexOf("1,1,1,1") > -1) {
      socket.emit("winner", 1);
    }
    else if(colStr.indexOf("2,2,2,2") > -1) {
      socket.emit("winner", 2);
    }
  }
};

io.on("connection", function(socket) {
	var newPlayer = {
    socket: socket,
		name: "",
		role: 0 //0: spectator, 1: player 1, 2: player 2
	};
	
	socket.on("start", function() {
    if(players[0] === undefined) {
      socket.emit("connected", 1);
      newPlayer.role = numPlayers;
      players[0] = newPlayer;
    }
    else if(players[1] === undefined) {
      socket.emit("connected", 2);
      newPlayer.role = numPlayers;
      players[1] = newPlayer;
    }
    else {
      socket.emit("connected", 0);
      spectators[socket.id] = newPlayer;
    }
    socket.emit("newBoard", boardState);
  });
  
  socket.on("placePiece", function(col) {
    if(newPlayer.role === 1 || newPlayer.role === 2) {
      if(newPlayer.role !== currTurn) {
        socket.emit("errorMsg", "It is not your turn yet");
      }
      else if(col < 0 || col > boardState.length - 1 || boardState[col].length >= maxHeight) {
        socket.emit("errorMsg", "Invalid piece placement");
      }
      else {
        boardState[col].push(newPlayer.role);
        socket.emit("newBoard", boardState);
        checkWin();
        
        currTurn = (currTurn === 1) ? 2 : 1;
      }
    }
    else {
      // player is spectator
      socket.emit("errorMsg", "Player is spectator, cannot place pieces");
    }
  });


	socket.on('disconnect', function() {
    if(newPlayer.role === 1) {
      delete players[0];
    }
    else if(newPlayer.role === 2) {
      delete players[1];
    }
    else {
      delete spectators[socket.id];
    }
	});
});

app.use(comp());
app.use(express.static(__dirname + '/../client'));
var port = process.env.PORT  || 5000;
http.listen(port, function() {
	console.log("listening on:" + port);
});

