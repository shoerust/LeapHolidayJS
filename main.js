	  
	// Get the canvas DOM element 
var canvas = document.getElementById('canvas');

// Making sure we have the proper aspect ratio for our canvas
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Create the context we will use for drawing
var c =  canvas.getContext('2d');

var img = document.createElement('img');
img.src = "img/spectrum.jpg";
c.drawImage( img , 0 , 0 );

// Save the canvas width and canvas height
// as easily accesible variables
var width = canvas.width;
var height = canvas.height;

function leapToScene( frame , leapPos ){

  var iBox = frame.interactionBox;

  var left = iBox.center[0] - iBox.size[0]/2;
  var top = iBox.center[1] + iBox.size[1]/2;

  var x = leapPos[0] - left;
  var y = leapPos[1] - top;

  x /= iBox.size[0];
  y /= iBox.size[1];

  x *= width;
  y *= height;

  return [ x , -y ];
};

function Holiday(address) {
  this.address = address;
  console.log("Address set to ", this.address)
  
  this.NUM_GLOBES = 50;
  this.FRAME_SIZE = 160;      // Secret API rame size
  this.FRAME_IGNORE = 10;     // Ignore the first 10 bytes of frame
  socketId = null;         // No socket number just yet

  this.closeSocket = closeSocket;
  this.setglobe = setglobe;
  this.getglobe = getglobe;
  this.render = render;

  var globes = new Uint8Array(160);
  this.globes = globes;
  console.log('Array created');

  // Fill the header of the array with zeroes
  for (i=0; i < this.FRAME_IGNORE; i++) {
    this.globes[i] = 0x00;
  }

  // Create the socket we'll use to communicate with the Holiday
  chrome.socket.create('udp', {},
   function(socketInfo) {           // Callback when creation is complete
      // The socket is created, now we want to connect to the service
      socketId = socketInfo.socketId;
      console.log('socket created ', socketInfo.socketId);
    }
  );
 
  function closeSocket() {
    chrome.socket.destroy(socketId);
    console.log("Socket destroyed");
  }

  function setglobe(globenum, r, g, b) {
    // Sets a globe's color
    if ((globenum < 0) || (globenum >= this.NUM_GLOBES)) {
      return;
    }

    baseptr = this.FRAME_IGNORE + 3*globenum;
    globes[baseptr] = r;
    globes[baseptr+1] = g;
    globes[baseptr+2] = b; 

    return;
  }

  function getglobe() {
    // Sets a globe's color
    if ((globenum < 0) || (globenum >= this.NUM_GLOBES)) {
      return;
    }

    baseptr = this.FRAME_IGNORE + 3*globenum;
    r = globes[baseptr];
    g = globes[baseptr+1];
    b = globes[baseptr+2];
    return [r,g,b];
  }

  function render() {
    //console.log("Holiday.render");
    //var locaddr = this.address;
    var glbs = this.globes;
    var sid = socketId;
    if (sid == null) {
      console.log("No socket abort render");
      return;
    }

    // Connect via the socket
    chrome.socket.connect(socketId, this.address, 9988, function(result) {

       // We are now connected to the socket so send it some data
      chrome.socket.write(socketId, glbs.buffer,
       function(sendInfo) {
         //console.log("wrote " + sendInfo.bytesWritten);
         x = 1;
      });
    });
    return;
  }
}


function main() {

  var controller = new Leap.Controller();
  var  hol = new Holiday($('#selector').val());

  // When the controller is ready, spawn the unicorn!
  controller.on( 'ready' , function(){
      console.log('ready!');
  });
 
  controller.on( 'frame' , function(frame){

    c.drawImage( img , 0 , 0 );

    for( var i=0; i < frame.hands.length; i++ ) {

	    var hand = frame.hands[i];

	  	var finger = hand.fingers[0];

	    if (finger != null) {
	      var globe = 0;
	      var fingerPos = leapToScene( frame , finger.tipPosition );
	      var x = fingerPos[0];
	      var y = fingerPos[1];
	      var color = c.getImageData(x, y, 1, 1).data;
	      for (var i = 10; i < 160; i++) {
	      	hol.setglobe(i, color[0], color[1], color[2]); 
	      }
        //console.log(color[0] + ' ' + color[1] + ' ' + color[2]);
	      hol.render();
	      c.fillStyle = "#FFFFFF";
	      c.beginPath();
  		  c.arc(x, y, 10, 0, Math.PI*2); 
  		  c.closePath();
  		  c.fill();

	    }
    }
  });
	 
	controller.connect();
}

function doRefresh() {
  $("#thebutton").val('Scanning...');
  refresher();
}

$( document ).ready( function() {
  console.log("Doing the ready");
  $("#thebutton").click(function () {
    doRefresh();
  });
});

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('button').addEventListener('click', main);
});