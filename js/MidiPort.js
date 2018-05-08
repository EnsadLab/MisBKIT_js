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
    this.enabledOnGUI = false;
    this.midiIn = new MIDI.input();
    this.midiOut = new MIDI.output();
    this.callback = null;
    this.portName = "";
    this.portID = 0;
    var self = this;

    
    this.midiIn.on('message', function (dt, msg) {
        if(self.enabled) {

            /*
            www.computermusicresource.com/MIDI.Commands.html
            m[0] : status (128-255) -> (128-159):notes, (176-191): CC (176=CC chanel 1, 177=CC chanel 2...), ...
            m[1] : data 1 (0-127) 
            m[2] : data 2 (0-127)
            */
            
            /*
            if(msg[0] >= 128 && msg[0] <= 159)
                console.log("RECEIVING midi note:", msg[0], msg[1], msg[2]);
            else if(msg[0] >= 176 && msg[0] <= 191)
                console.log("RECEIVING midi CC:", msg[0], msg[1], msg[2]);
            */

            //!! when sending from the midi controller, the distinction between
            // the different sliders is not made in the channel selection
            // but it is stored in the control value -> msg[1]


            var cmd = "";
            
            if(msg[0] >= 128 && msg[0] <= 159){
                cmd = "note"; // TODO: off and on can also be distinguished in data2, right?
            }else if(msg[0] >= 176 && msg[0] <= 191) cmd = "CC";
            else console.log("New MIDI command with number " + msg[0] + " -> needs to be added in code");
            
            // if it is CC, we take the controller value
            if(midiPortManager.enabled){
                if(cmd == "CC"){
                    motorMappingManager.setMappingToActive("midi",self.portName,cmd,msg[1]);
                    if(motorMappingManager.isMapped("midi",self.portName,cmd,msg[1])){
                        var motorIDs = motorMappingManager.getMotorIndex("midi",self.portName,cmd,msg[1]);
                        for(var i=0; i<motorIDs.length; i++){
                            dxlManager.onMidi(motorIDs[i], "midi", msg[2]);
                        }
                    }else if(motorMappingManager.isMapped("midi",self.portName,cmd,32 - msg[1])){ // STOP BUTTONS
                        var motorIDs = motorMappingManager.getMotorIndex("midi",self.portName,cmd,32-msg[1]);
                        for(var i=0; i<motorIDs.length; i++){
                            dxlManager.onMidi(motorIDs[i], "midi", 127.0*0.5);
                        }
                    }else if(msg[1] == 42) {// BIG STOP BUTTON
                        dxlManager.stopAllMotors();
                    }
                    if(sensorManager.isMapped("sensor",self.portName,cmd,msg[1])){     
                        var mappedSensors = sensorManager.getSensorIds("sensor",self.portName,cmd,msg[1]);
                        for(var i=0; i<mappedSensors.length; i++){
                            //console.log("CC",mappedSensors[i],msg[2]);
                            sensorManager.onMidi(mappedSensors[i],"sensor",msg[2]);
                        }
                    }
                }else if(cmd == "note"){ // if it is note, we take the channel value (-> no controller value)
                    var channel;
                    if(msg[0] <= 143) channel = msg[0] - 128;// + 1; // notes OFF
                    else channel = msg[0] - 144;// + 1; // notes ON
                    motorMappingManager.setMappingToActive("midi",self.portName,cmd,channel);
                    //console.log("chanel ",channel);
                    if(motorMappingManager.isMapped("midi",self.portName,cmd,channel)){
                        var motorIDs = motorMappingManager.getMotorIndex("midi",self.portName,cmd,channel);
                        for(var i=0; i<motorIDs.length; i++){
                            dxlManager.onMidi(motorIDs[i], "midi", msg[2]); //quick n dirty
                        }
                    }
                    if(sensorManager.isMapped("sensor",self.portName,cmd,channel)){
                        var mappedSensors = sensorManager.getSensorIds("sensor",self.portName,cmd,channel);
                        for(var i=0; i<mappedSensors.length; i++){
                            //console.log("note",mappedSensors[i],msg[1]);
                            sensorManager.onMidi(mappedSensors[i],"sensor",msg[2]);
                        }
                    }
                }
            }

            if (self.callback)
                self.callback(msg[1], msg[2] / 127);
        }
    });
    

};

MidiPort.prototype.sendMidi = function(cmd,index,val){
    
    var arg_0;
    if(cmd){ // note
        arg_0 = +index + 144;
    }else{ // cc
        arg_0 = +index + 176;
    }
    val = parseFloat(val) * 127.0;
    //console.log("SENDING midi:",cmd," // ",arg_0,index,val);
    this.midiOut.sendMessage([arg_0,index,val]); // 2nd argument? Since index is already included in first arg.
}

MidiPort.prototype.close = function(n) {
    this.enabled = false;
}


MidiPort.prototype.open = function () {
    console.log("OPENING MIDI PORT: " + this.portName + " on port ID: " + this.portID);
    this.midiIn.openPort(this.portID);
    this.midiOut.openPort(this.portID);
    this.enabled = true;
    return this.enabled;
}

