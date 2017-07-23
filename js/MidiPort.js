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


MidiPort = function () {
    this.enabled = false;
    this.midiIn = new MIDI.input();
    this.callback = null;
    this.portName = "";
    this.portID = 0;
    var self = this;

    this.midiIn.on('message', function (dt, msg) {
        if(self.enabled) {
            //console.log("midi CC:", msg[1], " val:", msg[2] / 127, " dt:", dt);

            // Send to midiPortManager instead?
            dxlManager.onMidi(msg[1], "midi", msg[2]); //quick n dirty

            if (this.callback)
                this.callback(msg[1], msg[2] / 127);
        }
    });

};

MidiPort.prototype.close = function(n) {
    this.enabled = false;
}


MidiPort.prototype.open = function () {
    console.log("OPENING MIDI PORT: " + this.portName + " on port ID: " + this.portID);
    this.midiIn.openPort(this.portID);
    this.enabled = true;
    return this.enabled;
}

