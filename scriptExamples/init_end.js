//init_end.js

var a = 0
dxl.mode(0,"joint")


/* called once before entering loop */
this.loop_init = function(){
  a = 0
  timeout(2000) // "loop" duration : 2 seconds
}

this.loop = function(){
    dxl.angle( 0 , Math.sin(a)*150 )
  	a += 0.3
  	this.log( a )
}

this.loop_end = function(){
  next("task1")
}

//---------------------------

/* called once before entering task1 */
this.task1_init = function(){
  a = 0
  timeout(5000) // "task1" duration : 5 seconds
}

this.task1 = function( t ){
    dxl.angle( 0 , Math.sin(a)*150 )
  	this.log( a )
  	a += 0.05
}

/* called once when t reached timeout  */
this.task1_end = function( t ){
	next("loop")
}

