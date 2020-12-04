//Start of Classes
//{
//Class for storing data about each player
class Player {
	//constructor takes in their name, x and y position, the radius of the player and unique id
	constructor(name, x, y, radius, id){
		//Set the classes name, x, y and radius to the values taken in from the constructor
		this.x = x
		this.y = y
		this.radius = radius
		this.name = name
		//Set a unique ID to be recognised by the server
		this.id = id
		//Set the default velocity of the player and the current velocity (upon creation these are the same)
		this.defaultVel = 4
		this.vel = this.defaultVel
		//Set the mass of the player to PI*radius^2
		this.mass = radius * radius * Math.PI
		//Used to find out whether the player is boosting
		this.boostToggled = false
		//Stores whether or not the player has been removed
		this.removed = false
		//Direction variable to move the character
		this.moveLeft = false
		this.moveRight = false
		this.moveUp = false
		this.moveDown = false
	}
}

//Class for storing data about each piece of nibble
class Nibble {
	//Construcor takes in the x and y position of the nibble, as well as its radius and stores whether or not its been removed
	constructor(x, y, radius){
		this.x = x
		this.y = y
		this.radius = radius
		this.removed = false
	}
}
//}
//End of Classes

//Start of Variables
//{
//Has the game started? (Build in delay for the player to connect to the server)
var started = false;
var wait = 0
const waitTime = 10

//Create an array to be used to store nibble objects
var nibble = []
//The radius of each nibble object
const nibbleRad = 5.5
//The mass of each nibble object (PI*radius^2)
const nibbleMass = nibbleRad*nibbleRad * Math.PI

//Store the size of the level (from -worldSzie to worldSize in both the X and Y directions)
const worldSize = 3500
//Store the total ammount of nibble on the level
const totalNibble = 1750

//The width and height of the game screen (1920 and 1080 are placeholder values)
var width = 1920
var height = 1080
//A value used to check if the game is on its first frame
var first = true

//Default player name if something goes wrong inputting one
let playerName = 'Player'

//Used for positioning the camera (offsetting the x and y of the world)
var offsetX = 0
var offsetY = 0

//How big the death pop-up window should be
const deathWindowWidth = 400;
const deathWindowHeight = 300;

//Creates an array to store each player on the server
var players = []
//Used to hold and update the client player
var client
//The starting radius of each player
const playerStartRad = 16
//The mass the player must be greater than to be able to use the boost mechanic
const boostThreshold = 1750
//MongoJS variables
var mongojs = require("mongojs");
var db = mongojs('localhost:27017/project', ['highScore']);
//Highest ever nibble count
var highestNibble = parseInt(db.score.find({}).sort({"highScore" : -1}).limit(1).toString());
//}
//End of Variables

//Start of server side functions and events
//{
//Socket.io connection setup
import io from 'socket.io-client';
const socket = io(`ws://localhost:2000`);
const connectPromise = new Promise(resolve => {
	socket.on('connect', () => {
		console.log('Connected to server!');
		$("#scoreBoard").append(highestNibble)
		resolve();
	});
	socket.on('playerData', (dat) =>{
		if(player.removed){
			createPlayer();
		}
		//Take player data, update values in players array and send back to other players
        if(players.length > dat.id){
            players[dat.id].x = dat.x
            players[dat.id].y = dat.y
            players[dat.id].radius = dat.radius
            socket.emit('playerData', {x: dat.x, y: dat.y, radius: dat.radius, id: dat.id})
        } else {
            players.push({x: dat.x, y: dat.y, radius: dat.radius, id: dat.id})
            socket.emit('playerData', {x: dat.x, y: dat.y, radius: dat.radius, id: dat.id})
        }
	});
});

//Set the interval of the updateServer function to run every 16ms (approx. 60 times per second)
setInterval(updateServer, 16)
function updateServer() {
	if(wait > waitTime){
		socket.emit('levelData', (nibble, players))
		//Send position to server
		socket.emit('playerData', {name: client.name, id: client.id, x: client.x, y: client.y, radius: client.radius, removed: client.removed});
		//Ping the server to see if it should be removed
		socket.emit('shouldRemove')
	}
}
//}
//End of server side functions and events

//Start of client side functions and events
//{
//Start the game for a player
function startClient(){
	//Loop for each piece of nibble that should be in the game
	for (var i = 0; i < nibble.length; i++) {
		//Create an element in the body of the HTML code to represent this piece of nibble, with a unique ID
		$("body").append("<div class=nibble id=" + i.toString() + "></div>")
	}
	//Loop for each player that should be in the game
	for (var i = 0; i < players.length; i++) {
		//Create an element in the body of the HTML code to represent other players, with a unique id
		$("body").append("<div class=player id=" + players[i].id + "></div>")
		$(".player,#" + players[i].id).append("<p>" + players[i].name + "</p>");
	}
	//Set the width and height to the width and height of the window
	width = $(window).width();
	height = $(window).height();
	//Create the screen to be shown when the player dies
	buildDead()
	//Create the player to represent the client
	createPlayer();
}

//Create the client player
function createPlayer(){
	//Set the client to be a new player at random position in the world with the default radius
	client = new Player(playerName, random(-worldSize + 300, worldSize -300),random(-worldSize + 300, worldSize -300),playerStartRad, players.length)
	//Set up for drawing
	$("body").append("<p class=mass>Nibbles Eaten</p>")
	$(".mass").show()
	$("body").append("<div class=player id=" + client.id + "></div>")
	$(".player,#" + client.id).append("<p>" + playerName + "</p>");
	//Add the client to the list of players, at the end of the list
	players[client.id] = client

}

//Format the dead screen using jquery
function buildDead(){
	$("body").append("<div class=deathScreen></div>")
	$("body").append("<h3 class=deathScreen id=deathText>PRESS SPACE TO PLAY AGAIN</h3>")
	$(".deathScreen").css("margin-left", (width/2 - deathWindowWidth/4).toString()+"px")
	$(".deathScreen").css("margin-top", (height/2 - deathWindowHeight).toString()+"px")
	$("#deathText").css("margin-left", (width/2 - deathWindowWidth/4).toString()+"px")
	$("#deathText").css("margin-top", (height/2 - deathWindowHeight).toString()+"px")
	$(".deathScreen").hide()
}

//show dead screen
function displayDead(){
	$(".deathScreen").show()
}

//hide dead screen
function hideDead(){
	$(".deathScreen").hide()
}

//loop
function loop(timestamp) {
	//Calls the draw function
	draw()
	//Run the loop the next time the window is ready to update (Runs until the game is closed)
	window.requestAnimationFrame(loop)
}

//Run the loop when the window is ready to update
window.requestAnimationFrame(loop)

//Set the interval of the update function to run every 16ms (approx. 60 times per second)
setInterval(updateClient, 16);

//Update function 
function updateClient(){
	//Make sure the width and height are still accurate
	width = $(window).width();
	height = $(window).height();
	//If the game has just been launched (if its the first frame)
	if(wait == waitTime){  
		//Start the client
		startClient()
		wait++
		//Once this has happened it is no longer the first frame, dont run it again
	} else if(wait > waitTime){
		if(!client.removed){
			//Handle key input from the client
			keyInput()
			//If the clients radius is not accurate (based off of its current mass)
			if(client.radius != Math.sqrt(client.mass / Math.PI)){
				//Set it to be the correct value using a formula derived from the radius formula
				client.radius = Math.sqrt(client.mass / Math.PI)
			}
			//Movement Handling
			if(client.moveRight){
				client.x += client.vel
			}
			if(client.moveLeft){
				client.x -= client.vel
			}
			if(client.moveDown){
				client.y += client.vel
			}
			if(client.moveUp){
				client.y -= client.vel
			}
			//If the client is going above the default speed (using boost)
			if(client.vel > client.defaultVel){
				//Decrease the players speed by 0.02x its total
				client.vel *= 0.98
				//Otherwise make sure the clients velocity is set to the default (not below, as sometimes the above code will make it lower than it should be)
			} else client.vel = client.defaultVel
		}
	}
	//Before the player enters the server
	if(started && wait < waitTime){
		wait++
	} else {
		if(wait == 0){
			//Pressing enter on the log-in screen sets the name and starts the game
			$(document).keydown(function(event){
				if(event.key == "Enter"){
					playerName = document.getElementById("inputName").value
					startGame()
				}
				
			});
			//Remove all the log-in UI and set started to true
			function startGame(){
				$("#loginBox").remove()
				$("#welcome").remove()
				$("#enterName").remove()
				$("#inputName").remove()
				$("#scoreBoard").remove()
				started = true
			}
		}
	}
}

//When it recieves level data
socket.on('levelData', (foo, pla) => {
	//Add all the nibble in the level to the list of nibble in the client
	for(var i = 0; i < totalNibble; i++){
		nibble.push(new Nibble(foo[i].x, foo[i].y, nibbleRad))
	}
	//Do the same for players
	for(var i in pla){
		players[pla[i].id] = new Player(pla[i].name, pla[i].x, pla[i].y, pla[i].radius, pla[i].id)
		if(pla[i].removed){
			players[pla[i].id].removed = true
		}
	}
	draw();
})
function addScore(data,cb){
	db.score.insert({highScore: data},function(err){
		cb();
	});
}
//If a player is removed then make sure it appears that way for the client
socket.on('playerRemoved', (dat) => {
	console.log(client.mass)
	if(dat[0] == client.id){
		client.removed = true
	} else if(dat[1] == client.id){
		if(!players[dat[0].removed]){
			client.mass += players[dat[0]].radius * players[dat[0]].radius * Math.PI
		}
	}
	players[dat[0]].removed = true
	players[dat[0]].x = -1000000
	players[dat[0]].y = -1000000
	players[dat[0]].radius = 0
	
})

//When the client recieves player data, update that player in the players array
socket.on('playerData', (dat) => {
	var found = false
	for(var i = 0; i < players.length; i++){
		if(players[i].id == dat.id){
			players[i].x = dat.x
			players[i].y = dat.y
			players[i].radius = dat.radius
			players[i].name = dat.name
			players[i].removed = dat.removed
			players[i].mass = dat.radius*dat.radius*Math.PI
			found = true
		}
	}
	//If it doesn't exist in the players array, its a new player and should be added
	if(!found){
		players.push(new Player(dat.name, dat.x, dat.y, dat.radius, dat.id))
		$("body").append("<div class=player id=" + dat.id + "></div>")
	}
})

//Handle input from the clients keyboard
function keyInput(){
	document.addEventListener('keydown', function(event) {
		if(!client.removed){
			//Check if a specific key is pressed
			if(event.key === 'd' || event.key === 'ArrowRight') {
				client.moveRight = true
			} if(event.key === 'a' || event.key === 'ArrowLeft') {
				client.moveLeft = true
			} if(event.key === 'w' || event.key === 'ArrowUp'){
				client.moveUp = true
			} if(event.key === 's' || event.key === 'ArrowDown'){
				client.moveDown = true
			}
			//If space is being pressed
			if (event.key === ' '){
				//If the mass of the client is greater than the boost threshold
				if (client.mass > boostThreshold){
					if(!client.boostToggled){
						client.vel += 12
						client.mass -= client.mass/4
						client.boostToggled = true
					}
				}
			}
		} else {
			//If space is being pressed
			if (event.key === ' '){
				//Respawn the player
				players[client.id] = new Player(playerName, 0, 0, playerStartRad, client.id)
				client = players[client.id]
				//Boost to prevent wasting mass as soon as the player spawns
				client.boostToggled = true
				socket.emit('respawn', client.id)
			}
		}
	})

	//Check for a key being released
	document.addEventListener('keyup', function(event) {
		//Check if a specific key is released
		if(event.key === 'd' || event.key === 'ArrowRight') {
			client.moveRight = false
		} if(event.key === 'a' || event.key === 'ArrowLeft') {
			client.moveLeft = false
		} if(event.key === 'w' || event.key === 'ArrowUp'){
			client.moveUp = false
		} if(event.key === 's' || event.key === 'ArrowDown'){
			client.moveDown = false
		}
		//If space has been released
		if (event.key === ' '){
			//The player is no longer boosting, so set boostToggled to false
			client.boostToggled = false
		}
	})
}

//Draw the game to the clients screen
function draw(){
	if(wait > waitTime){ 
		offsetX = -client.x + width/2
		offsetY = -client.y + height/2
		//Loop through all the nibble in the nibble array
		for (var i = 0; i < nibble.length; i++) {
			//Check to see if the nibble is within the viewport of the game
			if(!nibble[i].removed){
				if (nibble[i].x + offsetX >= 0 - nibbleRad && nibble[i].x + offsetX <= width + nibbleRad){
					if (nibble[i].y + offsetY >= 0 - nibbleRad && nibble[i].y + offsetY <= height + nibbleRad){
						//If it is, check for collision with the player
						collision(nibble[i])
						//Move where its being drawn on the screen to correspond with its position in the viewport (Again using CSS's margin as the offset)
						$("#"+i).css("margin-left", (nibble[i].x + offsetX).toString()+"px");
						$("#"+i).css("margin-top", (nibble[i].y + offsetY).toString()+"px");
						//Show the nibble
						$("#"+i).show()
						//If the nibble is slightly offscreen (vertically), hide it
					} else if (nibble[i].y + offsetY >= -100-nibbleRad && nibble[i].y + offsetY <= height+100 + nibbleRad){
						$("#"+i).hide()
					}
					//If the nibble is slightly offscreen (horizontally), hide it
				} else if (nibble[i].x + offsetX >= -100-nibbleRad && nibble[i].x + offsetX <= width+100 + nibbleRad){
					$("#"+i).hide()
				}
			} else {
				$("#"+i).hide()
			}
		}

		//Loop through each player
		for(var i = 0; i < players.length; i++){
			//Move where each player being drawn on the screen to correspond with its position in the viewport (Again using CSS's margin as the offset)
			$(".player,#" + players[i].id).css("margin-left", (players[i].x + offsetX - players[i].radius).toString()+"px");
			$(".player,#" + players[i].id).css("margin-top", (players[i].y + offsetY - players[i].radius).toString()+"px");
			$(".player,#" + players[i].id).css("width", (players[i].radius*2).toString()+"px");
			$(".player,#" + players[i].id).css("height", (players[i].radius*2).toString()+"px");
			$(".player,#" + players[i].id).css("background-color", "crimson")
			//Write the name below the player
			$("p,.player,#" + players[i].id).html(players[i].name).css("color", "white").css("text-align", "center");
			//Show the player if its in the game, otherwise remove it
			if(players[i].removed){
				$(".player,#" + players[i].id).hide()
			} else {
				$(".player,#" + players[i].id).show()
			}
		}

		//If the client player has been removed display the dead screen, otherwise hide the dead screen
		if(client.removed){
			displayDead()
		} else {
			hideDead()
			$(".mass").text("Nibbles Eaten: " + Math.round(client.mass/100));
		}
	}
}

//Function to generate a random number
function random(min, max) {
	return Math.floor(Math.random() * (max - min) ) + min;
}
//}
//End of client side dunctions and events

//Start of functions and events that handle nibbles
//{
//Collision handling
function collision(currentNibble) {
	if(!client.removed){
		//Use distance formula to see how far away the player is from the nibble
		var dist = Math.sqrt((currentNibble.x - (client.x - 16))*(currentNibble.x - (client.x - 16)) + (currentNibble.y-(client.y - 16))*(currentNibble.y-(client.y - 16)))
		//If the nibble is within the radius of the player
		if(dist < client.radius + nibbleRad){
			//Get the index of this piece of nibble in the array
			var i = nibble.indexOf(currentNibble)
			//Set new x and y 
			socket.emit('eaten', i);
			nibble[i].removed = true
			//Add the mass of this piece of nibble to the clients mass
			client.mass += nibbleMass
		}
	}
}

//When a nibble is added, update the nibble array
socket.on('nibbleAdded', (dat) => {
	nibble[dat.i].x = dat.x
	nibble[dat.i].y = dat.y
	nibble[dat.i].removed = false
	//Move where its being drawn on the screen to correspond with its position in the viewport (Again using CSS's margin as the offset)
	$("#"+dat.i).css("margin-left", (dat.x + offsetX).toString()+"px");
	$("#"+dat.i).css("margin-top", (dat.y + offsetY).toString()+"px");
	$("#"+dat.i).hide()
})

//When nibble has been eaten, remove that piece of nibble
socket.on('eaten', (dat) => {
	nibble[dat].removed = true
	nibble[dat].hide()
	socket.emit('levelData', (nibble, players))
	if(mass/1000 > highestNibble){
		addScore((mass/1000), true)
	}
})
//}
//End of functions and events that handle nibbles