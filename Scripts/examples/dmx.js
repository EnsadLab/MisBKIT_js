

//dmx.js

// A tester avec spot DMX 

var info = ""
var dmxChanged = false

this.loop = function(t){
  this.log( info )
  if(dmxChanged){
    dmxChanged = false
    dmx.sendFrame()
  }
}

this.onKey = function( k ){
  switch( k ){
    case 'd':
      info = "open"
      dmx.open()
      break
    case 'x':
      info = "close"
      dmx.close()
      break      
    case 'r':
      info = "rgb"
      dmx.setRGB(2,255,0,255)
      dmxChanged = true
      break      
  }
}
