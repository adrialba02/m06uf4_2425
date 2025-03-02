const PORT = 7777;
const http = require('http');
const static = require('node-static');
const ws = require('ws');
const file = new static.Server('./public');
const http_server = http.createServer((request, response) => {
  request.addListener('end', () => {
    file.serve(request, response);
  }).resume();
}).listen(PORT);
const ws_server = new ws.Server({ server: http_server });
let player1 = null, player2 = null;
let spectators = [];
let gameStarted = false;
ws_server.on('connection', function(conn) {
  console.log("User Connected");
  if (player1 == null) {
    player1 = conn;
    let info = { player_num: 1 };
    player1.send(JSON.stringify(info));
    player1.on('close', function() {
      console.log("Player 1 disconnected");
      player1 = null;
      notifyDisconnection(1);
    });
    player1.on('message', function(msg) {
      let info = JSON.parse(msg);
      if(info.y !== undefined) {
        let player1Move = { player1_y: info.y };
        if(player2) player2.send(JSON.stringify(player1Move));
        sendToSpectators(player1Move);
      }
      if(info.bx !== undefined && info.by !== undefined) {
        if(player2) player2.send(JSON.stringify(info));
        sendToSpectators(info);
      }
      if(info.ps1 !== undefined && info.ps2 !== undefined) {
        if(player2) player2.send(JSON.stringify(info));
        sendToSpectators(info);
      }
      if(info.game_over !== undefined) {
        if(player1) player1.send(JSON.stringify(info));
        if(player2) player2.send(JSON.stringify(info));
        sendToSpectators(info);
      }
    });
  } else if (player2 == null) {
    player2 = conn;
    let info = { player_num: 2, player_start: 2 };
    player2.send(JSON.stringify(info));
    if (!gameStarted) {
      gameStarted = true;
      console.log("Both players connected! Starting countdown...");
      let countdown = 3;
      let countdownInterval = setInterval(() => {
        let countdownMsg = { countdown: countdown };
        if(player1) player1.send(JSON.stringify(countdownMsg));
        if(player2) player2.send(JSON.stringify(countdownMsg));
        sendToSpectators(countdownMsg);
        countdown--;
        if (countdown < 0) {
          clearInterval(countdownInterval);
          setTimeout(function() {
            let startMsg = { game_start: true };
            if(player1) player1.send(JSON.stringify(startMsg));
            if(player2) player2.send(JSON.stringify(startMsg));
            sendToSpectators(startMsg);
          }, 500);
        }
      }, 1000);
    }
    player2.on('close', function() {
      console.log("Player 2 disconnected");
      player2 = null;
      notifyDisconnection(2);
    });
    player2.on('message', function(msg) {
      let info = JSON.parse(msg);
      if(info.y !== undefined) {
        let player2Move = { player2_y: info.y };
        if(player1) player1.send(JSON.stringify(player2Move));
        sendToSpectators(player2Move);
      }
      if(info.game_over !== undefined) {
        if(player1) player1.send(JSON.stringify(info));
        if(player2) player2.send(JSON.stringify(info));
        sendToSpectators(info);
      }
    });
  } else {
    spectators.push(conn);
    console.log("Spectator connected");
    let gameState = { player1_y: 225, player2_y: 225 };
    conn.send(JSON.stringify(gameState));
    conn.on('close', function() {
      console.log("Spectator disconnected");
      spectators = spectators.filter(s => s !== conn);
    });
  }
});
function notifyDisconnection(playerNum) {
  let disconnectMsg = { opponent_disconnected: true };
  if (playerNum === 1 && player2) {
    player2.send(JSON.stringify(disconnectMsg));
  } else if (playerNum === 2 && player1) {
    player1.send(JSON.stringify(disconnectMsg));
  }
  sendToSpectators(disconnectMsg);
}
function sendToSpectators(data) {
  let jsonData = JSON.stringify(data);
  spectators.forEach(spectator => spectator.send(jsonData));
}
