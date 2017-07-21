/**
* Created by Didier on 06/05/16.
*/


//TODO mapping CC index (function?)
//nanoKontrol2
//cc 16  ... 23: rotaries
//cc 1,2 ... 8 : sliders
//cc 32 ... 39 : [S]
//cc 48 ... 55 : [M]
//cc 64 ... 71 : [R]
//cc 43 <<
//cc 44 >>
//cc 42 stop
//cc 41 play
//cc 45 rec
//cc 58  track <
//cc 59  track >
//cc 46  cycle
//cc 60  marker set
//cc 61  marker <
//cc 62  marker >

var MIDI = null;

MidiPort = function () {
    if(MIDI==null) {
        MIDI = require('midi');
    }

    this.enabled = false;
    this.midiIn = new MIDI.input();
    this.nbMidiIn = this.midiIn.getPortCount();
    this.midiInNum = 0;
    this.callback = null;
    var self = this;

    this.midiIn.on('message', function (dt, msg) {
        if(self.enabled) {
            //console.log("midi CC:", msg[1], " val:", msg[2] / 127, " dt:", dt);

            dxlManager.onMidi(msg[1], "midi", msg[2]); //quick n dirty

            if (this.callback)
                this.callback(msg[1], msg[2] / 127);
        }
    });


};

MidiPort.prototype.close = function(n) {
    this.enabled = false;
    /* GRRRR !!! impossible !!!
    if(this.midiIn)this.midiIn.closePort();
    this.midiIn = new this.midi.input(); //!!! ready to count
    */
}

/*
MidiPort.prototype.reopen = function(n){
    //this.close();
    this.nbMidiIn = this.midiIn.getPortCount();
    this.midiInNum = n;
    this.midiIn.on('message', function (dt, msg) {
        console.log("midi CC:", msg[1], " val:", msg[2] / 127, " dt:", dt);

        dxlManager.onMidi(msg[1],"midi", msg[2]); //quick n dirty

        if (this.callback)
            this.callback(msg[1], msg[2] / 127);
    });
}
*/

MidiPort.prototype.open = function (p) {
    //this.close(); //fout la merde
    this.enabled = false;
    var n=this.midiIn.getPortCount();
    var ip = parseInt(p);
    if(isNaN(ip)){
        console.log("midi by name",p);
        for(var i=0;i<n;i++){
            if(this.midiIn.getPortName(i)==p){
                console.log("found ",i," ",ip);
                //this.reopen(i);
                this.midiIn.openPort(i);
                this.midiInNum = i;
                this.enabled = true;
                break;
            }
        }
    }
    else if((ip>=0)&&(ip<n)){
        console.log("midi found num",ip);
        //this.reopen(ip);
        this.midiIn.openPort(ip);
        this.midiInNum = ip;
        this.enabled = true;
    }

    console.log("midi enabled:",this.enabled);
    return this.enabled;


    /*
    //this.close();
    var n=this.midiIn.getPortCount();
    //if(typeof p == 'number'){
    var ip = parseInt(p);
    console.log(p," ",ip," ",typeof p);
    if(ip!=NaN){
        console.log(p," ",ip," ",n);
        if(ip<n){
            this.midiIn.openPort(ip);
            this.midiInNum = ip;
        }
    }
    else{
        console.log(" by name");
        for(var i=0;i<n;i++){
            if(this.midiIn.getPortName(i)==p){
                this.midiIn.openPort(i);
                this.midiInNum = i;
                break;
            }
        }
    }
    */
};

/*
MidiPort.prototype.close = function () {
    this.midiIn.closePort();
};
*/

MidiPort.prototype.getPortName = function(index) {
    console.log("midiInCount ",this.midiIn.getPortCount());
    var ip = index ? index : this.midiInNum;
    if(ip < this.midiIn.getPortCount() )
        return this.midiIn.getPortName(ip|0);

    return null;
};

MidiPort.prototype.getPortNum = function(name) {
    var n=this.midiIn.getPortCount();
    for(var i=0;i<n;i++){
        if(this.midiIn.getPortName(i)==name)
            return i;
    }
    return -1;
};

