const PORT=7777;

let http = require('http');
let static = require('node-static');
let ws = require('ws');

let file = new static.Server('./public');
 
let http_server = http.createServer(function (request, response) 
{
    request.addListener('end', function () 
	{
        file.serve(request, response);
    }).resume();
}).listen(PORT);

let ws_server = new ws.Server({server:http_server});

let player1, player2;

ws_server.on('connection', function (conn){
	
	console.log("User Connected");

	if(player1 == null){
		player1 = conn;
		
		let info = {
			player_num: 1
		};

		player1.send(JSON.stringify(info) );
		
		player1.on('message', function (msg) {
			if (player2 == null)
				return;
		//	console.log("Player 1: " + msg);

			let info = JSON.parse(msg);

			if(info.y != null){
				player2.send(JSON.stringify(info));	
			}
			else if(info.by !=null)
			{
				player2.send(JSON.stringify(info));	
			}
			else if(info.ps1 !=null)
			{
				player2.send(JSON.stringify(info));	
			}
		});
	}
	else if (player2 == null){
		player2 = conn;

		let info = {
			player_num: 2
		};

		player2.send(JSON.stringify(info) );
		
		player2.on('message', function (msg) {
			if(player1==null)
				return;
		//	console.log("Player 2: " + msg);
			
			let info = JSON.parse(msg);

			if(info != null){
				player1.send(JSON.stringify(info));
			}
		});
	}
});
