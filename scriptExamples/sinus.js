// sinus example

var a = 0
var motorIndex = 1

dxl.mode( motorIndex ,'joint')

this.loop = function(){
  dxl.angle( motorIndex, Math.sin(a)*150 )
  a+=0.2
}
