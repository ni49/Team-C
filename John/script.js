function startGame() {
    var elem = document.getElementById("player");
	var id = setInterval(frame, 5)
	function frame() {
		document.onkeydown = function(event){
		if(event.keyCode === 68)	//d
			elem.moveAngle = -1;
		else if(event.keyCode === 83)	//s
			socket.emit('keyPress',{inputId:'down',state:true});
		else if(event.keyCode === 65) //a
			socket.emit('keyPress',{inputId:'left',state:true});
		else if(event.keyCode === 87) // w
			socket.emit('keyPress',{inputId:'up',state:true});
	}
	}
}

var myGameArea = {
    start : function() {
		this.interval = setInterval(updateGameArea, 20);
    },
	clear : function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}

function updateGameArea() {
	myGameArea.clear();
}