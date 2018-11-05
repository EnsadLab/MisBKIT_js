// minimal example

var a = 0

dxl.setMode(0,'joint')

this.loop = function(){
  dxl.setAngle(0, Math.sin(a)*150 )
  a+=0.2
}
