

//dmx.js

// A tester avec spot DMX 
var r = 0
var g = 0
var b = 0
dmx.setRGB(72,r,g,b)
dmx.sendFrame()

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
      dmx.setRGB(72,0,255,0)
      dmxChanged = true
      break      
  }
}
