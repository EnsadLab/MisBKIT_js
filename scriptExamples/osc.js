


var count = 0
var oscEnabled = true
osc.onOff("OSC0",oscEnabled) //optional: force port openning


this.loop = function( t ){
}

this.onOSC = function(addr,args){  
  this.log("OSC:",addr,args ) 
}

this.onKey = function(key){ //
  this.log("Key:",key)
  if(key=="o"){					//toggle osc on/off
    oscEnabled = !oscEnabled
		osc.onOff("OSC0",oscEnabled) //
    this.log("osc:",oscEnabled	)
  }
  else{
  	osc.send("/got/a/key",[count,key] )
  }
  count+=1  
}
