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

            /*
            http://computermusicresource.com/MIDI.Commands.html
            m[0] : status (128-255) -> (128-159):notes, (176-191): CC (176=CC chanel 1, 177=CC chanel 2...), ...
            m[1] : data 1 (0-127) 
            m[2] : data 2 (0-127)
            */
            
            /*
            if(msg[0] >= 128 && msg[0] <= 159)
                console.log("midi note:", msg[0], msg[1], msg[2]);
            else if(msg[0] >= 176 && msg[0] <= 191)
                console.log("midi CC:", msg[0], msg[1], msg[2]);
            */

            //!! when sending from the midi controller, the distinction between
            // the different sliders is not made in the channel selection
            // but it is stored in the control value -> msg[1]


            var cmd = "";
            
            if(msg[0] >= 128 && msg[0] <= 159){
                cmd = "note"; // TODO: off and on can also be distinguished in data2, right?
            }else if(msg[0] >= 176 && msg[0] <= 191) cmd = "CC";
            else console.log("New MIDI command with number " + msg[0] + " -> needs to be added in code");
            
            if(cmd == "CC"){
                if(motorMappingManager.isMapped("midi",self.portName,cmd,msg[1])){
                    var motorIDs = motorMappingManager.getMotorIndex("midi",self.portName,cmd,msg[1]);
                    for(var i=0; i<motorIDs.length; i++){
                        if(dxlManager.isEnabled(motorIDs[i]))
                            dxlManager.onMidi(motorIDs[i], "midi", msg[2]); //quick n dirty
                    }
                }else{
                    if(dxlManager.isEnabled(msg[1]))
                        dxlManager.onMidi(msg[1], "midi", msg[2]); //quick n dirty
                }
            } else if(cmd == "note"){
                var channel;
                
                if(msg[0] <= 143) channel = msg[0] - 128 + 1; // notes OFF
                else channel = msg[0] - 144 + 1; // notes ON
                if(motorMappingManager.isMapped("midi",self.portName,cmd,channel)){
                    var motorIDs = motorMappingManager.getMotorIndex("midi",self.portName,cmd,channel);
                    for(var i=0; i<motorIDs.length; i++){
                        if(dxlManager.isEnabled(motorIDs[i]))
                            dxlManager.onMidi(motorIDs[i], "midi", msg[1]); //quick n dirty
                    }
                }
            }

            if (self.callback)
                self.callback(msg[1], msg[2] / 127);
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

