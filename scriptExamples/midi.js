


//midi.js

this.loop = function( t ){
}

//port channel type data1 data2
this.onMidi = function(id,c,t,d1,d2){ 
    this.log("Midi:",id,c,t,d1,d2)
    if( t==3 && d1==1 ){ //CC n° 1
        dxl.onNormControl( 1,d2/127) //angle or speed depending on mode   
    }
}
