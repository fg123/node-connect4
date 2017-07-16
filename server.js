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
            return 1;
        }
        else if(colStr.indexOf("2,2,2,2") > -1) {
            return 2;
        }
    }
    return 0;
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
            newPlayer.role = 1;
            players[0] = newPlayer;
        }
        else if(players[1] === undefined) {
            socket.emit("connected", 2);
            newPlayer.role = 2;
            players[1] = newPlayer;
        }
        else {
            socket.emit("connected", 0);
            spectators[socket.id] = newPlayer;
        }
        console.log("Player joined as " + newPlayer.role);
        socket.emit("newBoard", boardState);

        if(players[0] && players[1]) {
            players[0].socket.emit("turn");
            currTurn = 1;
        }
    });

    socket.on("placePiece", function(col) {
        console.log("Placing piece as " + newPlayer.role + " at " + col);
        if(newPlayer.role === 1 || newPlayer.role === 2) {
            if(newPlayer.role !== currTurn) {
                socket.emit("errorMsg", "It is not your turn yet");
            }
            else if(col < 0 || col > boardState.length - 1 || boardState[col].length >= maxHeight) {
                socket.emit("errorMsg", "Invalid piece placement");
            }
            else {
                console.log("pushed");
                boardState[col].push(newPlayer.role);
                console.log(boardState);

                players[0].socket.emit("newBoard", boardState);
                players[1].socket.emit("newBoard", boardState);
                for(var id in spectators) {
                    spectators[id].socket.emit("newBoard", boardState);
                }

                var win = checkWin();
                if(win !== 0) {
                    players[0].socket.emit("winner", win);
                    players[1].socket.emit("winner", win);
                    for(var id in spectators) {
                        spectators[id].socket.emit("winner", win);
                    }
                    setTimeout(function() {
                        boardState = [[], [], [], [], [], [], []];
                        currTurn = 1;

                        players[0].socket.emit("reset");
                        players[1].socket.emit("reset");
                        for(var id in spectators) {
                            spectators[id].socket.emit("reset");
                        }
                    }, 5000);
                }
                else if(currTurn === 1) {
                    currTurn = 2;
                    players[1].socket.emit("turn");
                }
                else {
                    currTurn = 1;
                    players[0].socket.emit("turn");
                }
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
app.use(express.static(__dirname + '/client'));
var port = process.env.PORT  || 5000;
http.listen(port, function() {
    console.log("listening on:" + port);
});
