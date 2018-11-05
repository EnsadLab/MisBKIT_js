
//chaining 
// loop -> task1 -> task2 -> task3 -> task4 -> loop ....

next("loop" , 1000 ) //"loop" timmeout default is infinite

this.loop = function(t){
  this.log( t )
  next("task1",1000)
  // "task1" will launch at loop's timeout
  // "task1" duration is set to 1000 ( 1 second )  
}

this.task1 = function( t ){
  this.log( t )
  next("task2",500)
}

this.task2 = function( t ){
  this.log( t )
  next("task3",2000)  
}

this.task3 = function( t ){
  this.log( t )
  next("task4",500)    
}

this.task4 = function( t ){
  this.log( t )
  next("loop",2000)      
}
