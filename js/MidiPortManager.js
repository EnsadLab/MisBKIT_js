/**
* Created by Cecile on 21/07/17.
*/

var MIDI = null;

MidiPortManager = function () {

    if(MIDI==null) {
        MIDI = require('midi');
    }

    // this midi port is only used for getting general midi information like nb ports and etc...
    this.midiIn = new MIDI.input();

    // array of midi ports
    this.midiPorts = new Array();

};

MidiPortManager.prototype.open = function (p) {

    // for now, when we switch from one port to the other in the drop-down menu,
    // we want to be sure that no other port is still open
    for(var i=0; i<this.midiPorts.length; i++){
        this.midiPorts[i].close();
    }
    if(isNaN(p)){
        console.log("OPENING midi by name",p);
        var found = false;
        for(var i=0; i<this.midiPorts.length; i++){
            if(this.midiPorts[i].portName == p){
                this.midiPorts[i].open();
                found = true;
                break;
            }
        }
        if(!found){
            console.log("MidiPortManager::close -> portname " + p + " has not been founded. Should not happen");
        }
    }
    return found;
}

MidiPortManager.prototype.close = function(portName){
    var found = false;
    for(var i=0; i<this.midiPorts.length; i++){
        if(this.midiPorts[i].portName == portName){
            this.midiPorts[i].close();
            found = true;
        }
    }
    if(!found){
        console.log("MidiPortManager::close -> portname " + portName + " has not been founded. Should not happen");
    }
}

MidiPortManager.prototype.addMidiPort = function(portName, portID){
    
    var found = false;
    for(var i=0; i<this.midiPorts.length; i++){
        console.log("?? " + this.midiPorts[i] + " " + portName)
        if(this.midiPorts[i].portName == portName){
            console.log("Midiport " + portName + " has already been added");
            found = true;
            break;
        }
    }
    if(!found){
        console.log("Midiport " + portName + " has been added");
        try{ 
            var midiPortNew = new MidiPort(); 
            midiPortNew.portName = portName;
            midiPortNew.portID = portID;
        }catch(e){console.log(e);}//null;

        this.midiPorts.push(midiPortNew);
    }
    
}

MidiPortManager.prototype.getPortName = function(index) {
    if(index >= 0 && index < this.midiIn.getPortCount() ){
        return this.midiIn.getPortName(index);
    }
    return null;
};

MidiPortManager.prototype.getPortNum = function(name) {
    var n=this.midiIn.getPortCount();
    for(var i=0;i<n;i++){
        if(this.midiIn.getPortName(i)==name)
            return i;
    }
    return -1;
};

MidiPortManager.prototype.getCurrentPortName() = function()
{
    for(var i=0; i<this.midiPorts.length; i++){
        if(this.midiPorts[i].enabled){
            return this.midiPorts[i].portName;
        }
    }
    return ""; // TODO: or return null?
}