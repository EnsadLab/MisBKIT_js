
var sensorName = "scriptTest" //assumes you have sensor named "scriptTest"
var a = 0

this.setup = function(){
  sensor.activate(sensorName) //force enabling this sensor
}

this.loop = function(t){
  sensor.setValue( sensorName , Math.sin(a) ) //sensor's input , should be of no-type
  a+=0.2
  
  var v = sensor.getValue( sensorName )      //get output of sensor
  this.log("sensor value:", v)  
}

//"onStop" is called when script is stopped
this.onStop = function(){
  sensor.deactivate(sensorName) //force disabling this sensor  
}
