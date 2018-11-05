
//chaining 

next("loop" , 1000 )

this.loop = function(t){
  this.log( t )
  next("task1",500)
}

this.task1 = function( t ){
  this.log( t )
  next("task2",1000)
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
