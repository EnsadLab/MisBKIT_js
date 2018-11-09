//first_last.js
// alternative to  _init  & _end

var a = 0
dxl.mode(0,"joint")


this.loop = function( t ){
  	if(this.first){ // true when starting "loop"
		a = 0
  		timeout(2000) // "loop" duration : 2seconds
    }
    
    dxl.angle( 0 , Math.sin(a)*150 )
  	a += 0.3
  	this.log( t )

  	if(this.last) // true when timeout is reached
		  next("task1")
}

//---------------------------

this.task1 = function( t ){
	if(this.first){ // true when starting "task1"
		a = 0
  		timeout(5000) //task1 duration : 5seconds
	}

	dxl.angle( 0 , Math.sin(a)*150 )
	a += 0.05
	this.log( t )
  
	if(this.last) // true when timeout is reached
		next("loop")
  
}
