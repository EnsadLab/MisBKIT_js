/*
	Simple random , using .first and .last
*/

dxl.mode(0,"joint")

/*
 * private function example
 * if you need 'this', use this.myFunction = function(){}
*/
random = function(min,max){
  return Math.random()*(max-min) + min
}


this.loop = function(t){
  
  if(this.first)    // true when entering 'task function'
	  timeout( random(1000,5000) ) //random duration
  
  this.log( t )
  
  if(this.last)     // true when timeout is reached
    dxl.angle( 0 , random(-150,150) ) //one shot at timeout
    
}
