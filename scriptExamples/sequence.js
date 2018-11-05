// sequence using switch

var a = 0
var step = 0
var motor = 0

this.loop = function( t ){
  timeout(0)    // one shot
  step += 1
  switch(step){
    case 1:
      motor = 0
      next("sinus",2000) //next() takes effect only when t has reached timeout
      break
    case 2:
      goto("pause",1000) //goto() takes effect imediatelly
    case 3:
      motor = 1
      goto("sinus",1000)
    default:
      step = 0
  }
}

this.pause = function( t ){
  this.log("step:",step,"pause:",t)
  //go to loop when next() is not defined  
}

this.sinus = function( t ){
  if(this.start){ //true when "sinus" just started
    dxl.mode( motor ,'joint')
  }
	dxl.angle( motor , Math.sin(a)*150 )
  this.log("step:",step,"motor:",motor)
  a+=0.2
  //go to loop when next() is not defined  
}

