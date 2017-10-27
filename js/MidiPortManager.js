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

    console.log("MIDI");

};

MidiPortManager.prototype.open = function (p) {

    // for now, when we switch from one port to the other in the drop-down menu,
    // we want to be sure that no other port is still open
    /*for(var i=0; i<this.midiPorts.length; i++){
        this.midiPorts[i].close();
    }*/

    if(isNaN(p)){
        //console.log("OPENING midi by name",p);
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
    }else if((p>=0)&&(p<this.midiPorts.length)){
        var found = false;
        for(var i=0; i<this.midiPorts.length; i++){
            if(this.midiPorts[i].portID == p){
                this.midiPorts[i].open();
                found = true;
                break;
            }
        }
        if(!found){
            console.log("MidiPortManager::close -> portID " + p + " has not been founded. Should not happen");
        }
    }
    return found;
};

MidiPortManager.prototype.openMidiAtStart = function(){
    
    misGUI.simSelectMidiPorts();
   /* if(this.isValidMidiPort(portName)){
        misGUI.simSelectPort(portName);
    }*/
}

//TODO: try to close ports properly as well??
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
};

MidiPortManager.prototype.addMidiPort = function(portName, portID){
    
    var found = false;
    for(var i=0; i<this.midiPorts.length; i++){
        if(this.midiPorts[i].portName == portName){
            //console.log("Midiport " + portName + " has already been added");
            this.midiPorts[i].enabledOnGUI = true;
            found = true;
            break;
        }
    }
    if(!found){
        //console.log("Midiport " + portName + " has been added");
        try{ 
            var midiPortNew = new MidiPort(); 
            midiPortNew.enabledOnGUI = true;
            midiPortNew.portName = portName;
            midiPortNew.portID = portID;
            this.midiPorts.push(midiPortNew);
        }catch(e){console.log(e);}
    }
    
};

MidiPortManager.prototype.hidePortsFromGUI = function(){
    for(var i=0; i<this.midiPorts.length; i++){
        this.midiPorts[i].enabledOnGUI = false;
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

//TODO: cec, now it should return an array, because multiple ports can be open..
MidiPortManager.prototype.getCurrentPortName = function()
{
    for(var i=0; i<this.midiPorts.length; i++){
        if(this.midiPorts[i].enabled){
            return this.midiPorts[i].portName;
        }
    }
    return ""; // TODO: or return null?
};

MidiPortManager.prototype.isMidiPortEnabled = function(portName){
    if(this.isValidMidiPort(portName)){
        for(var i=0; i<this.midiPorts.length; i++){
            if(this.midiPorts[i].portName == portName){
                return this.midiPorts[i].enabled;
            }
        }
        return false;
    }
    return false;
}

MidiPortManager.prototype.isValidMidiPort = function(portName){
    for(var i=0; i<this.midiPorts.length; i++){
        if(this.midiPorts[i].portName == portName){
            return true;
        }
    }
    return false;
}

MidiPortManager.prototype.getNbMidiPorts = function(){
    return this.midiPorts.length;
}

MidiPortManager.prototype.getNbMidiPortsOnGUI = function(){
    var counter = 0;
    for(var i=0; i<this.midiPorts.length; i++){
        if(this.midiPorts[i].enabledOnGUI){
            counter++;
        }
    }
    return counter;
}

MidiPortManager.prototype.getFirstMidiPort = function(){
    if(this.midiPorts.length >= 1){
        return this.midiPorts[0].portName;
    }
    return "";
}

MidiPortManager.prototype.getFirstMidiPortOnGUI = function(){
    for(var i=0; i<this.midiPorts.length; i++){
        if(this.midiPorts[i].enabledOnGUI){
            return midiPorts[i].portName;
        }
    }
    return "";
}