// ramp :         v0,v1 , time0 , duration 
var myRamp = ramp(0,123,0,1000)
// when t <= time0           value = v0
// when t >= time0+duration  value = v1 


this.setup = function(){
}

this.loop = function(t){
  if(this.first){
    timeout(10000)
    myRamp.init(-100,100,t,10000)
    next("goBack")
  }

  var v = myRamp.value(t)
	dxl.control(0,v) //dxl.control : work with mode 'joint' and 'wheel'
	this.log( v )    
}

this.goBack = function(t){
  if(this.first){
    timeout(2000)
    myRamp.init(100,-100,t,2000) 
	}
  var v = myRamp.value(t)
	dxl.control(0,v)  
	this.log( v )  
}
