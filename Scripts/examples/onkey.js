
dxl.mode(0,"joint")
dxl.mode(1,"wheel")
dxl.mode(2,"wheel")

this.loop = function(t){
}

this.onKey = function( k ){
  this.log("key:",k)
  switch(k){
    case "ArrowUp":
      dxl.angle( 0, 150 )
      dxl.speed( 1, 50 )
      dxl.speed( 2, 50 )
      break
    case "ArrowDown":
      dxl.angle( 0, 0 )
      dxl.speed( 1, 0 )
      dxl.speed( 2, 0 )
      break
    case "ArrowLeft":
      dxl.speed( 1,-50 )
      dxl.speed( 2, 50 )
      break
    case "ArrowRight":
      dxl.speed( 1, 50 )
      dxl.speed( 2,-50 )
      break
  }
}
