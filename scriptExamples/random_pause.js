
// random & pause

this.setup = function(){
    dxl.mode(0,'joint')
}

  this.loop = function(){
    timeout(0)	                    //one shot
    var a = Math.random()*300 - 150 // range = [-150 150]
    dxl.angle(0,a)
    next("pause",1000)              //goto pause after timeout
  }
  
  this.pause=function(d){
    this.log("Pause:",d)
  }
  
  