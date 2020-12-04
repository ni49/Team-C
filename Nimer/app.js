//Use required packages
const Bundler = require('parcel-bundler');
const app = require('express')();
const server = require('http').createServer(app);
const socketIO = require('socket.io');
let io = socketIO(server);
const file = 'index.html'
const options = {}
const bundler = new Bundler(file, options)
app.use(bundler.middleware())
//Port to launch localhost on
const port = 2000
//Lists used to store the data for the clients to read
var nibble = {x: 50, y: 5}
var players = []
//World data
const nibbleTotal = 2000
const worldSize = 3500
//Start server
server.listen(port, () => {
    console.log('Server is up on port ' + port);
    //Create the world when the server starts
    createWorld()
});
//When a player connects
io.on('connection', (socket) => {
    //On disconnect
    socket.on('disconnect', () => {
        //Update for players
        socket.broadcast.emit('removal', socket.pos);
    });
    //Send the level data to the players
    socket.emit('levelData', nibble)
    //Recieve player data
    socket.on('playerData', (dat) =>{
        //Take player data, update values in players array and send back to other players
        if(players.length > dat.id){
            players[dat.id].x = dat.x
            players[dat.id].y = dat.y
            players[dat.id].radius = dat.radius
            socket.broadcast.emit('playerData', {x: dat.x, y: dat.y, radius: dat.radius, id: dat.id})
        } else {
            players.push({x: dat.x, y: dat.y, radius: dat.radius, id: dat.id})
            socket.broadcast.emit('playerData', {x: dat.x, y: dat.y, radius: dat.radius, id: dat.id})
        }
    })
})
//Create the world
function createWorld(){
    for(var i = 0; i < nibbleTotal; i++){
        nibble[i] = {x: random(-worldSize, worldSize), y: random(-worldSize, worldSize)}
    }
}
//Function to generate random number
function random(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}