/**
* Created by Cecile on 27/07/17.
*/

var connections = [
    "default",
    "cm9",
    "osc",
    "midi",
    "motor",
    "mobilizing", 
    "animations",
]

Sensor = function () {

    this.s = { //settings
        device: "",      //(Didier) Midi,CM9,Robus,OSC,Mike ...
        address: "",     //(Didier) example for Robus "octo_wifi"
        name:"",         //(Didier) example Pour robus "octo_portard2"
        enabled: false,
        threshold:50,   //default, pour addEmptySensor
        tolerance:20,
        valMin: 0,
        valMax: 100,
        anim1: "none", //TODO: change later in an array or not?
        anim2: "none",
        oscEnabledInput: false,
        oscEnabledOutput: false,
        mobilizingEnabledInput: false,
        mobilizingEnabledOutput: false,
        midiEnabledInput: false,
        midiPortInput: "",
        midiCmdInput: false, //true:note, false:CC
        midiMappingInput: 0,
        midiEnabledOutput: false,
        midiPortOutput: "",
        midiCmdOutput: false, //true:note, false:CC
        midiMappingOutput: 0,
        cm9EnabledInput: false,
        cm9Pin: 0,        
        motorEnabledInput: false,
        fromMotorIndex: 0,        
        motorEnabledOutput: false,
        toMotorIndex: 0,
        animationsEnabledOutput: false,
        ID_gui: -1,
        input_entry: "",
        output_entries:[]
    };
    //Suggestion:
    //   cm9:{ enabled:false , val:7 },


    this.currValue = -1;
    this.ID = -1;
    this.area = -1; // -1:nowhere, 0:before the threshold, 1:after the threshold
    this.oldArea = -1;
    this.freeze = false;

    this.freeze = true;
    this.enabled = false; //TODO TODO: check all this different enabled...??
    this.textDescription = "";
};

Sensor.prototype.copySettings = function(s){
    for(var e in s){
        this.s[e]=s[e];
    }
    this.init();
}

Sensor.prototype.getSettings = function(){
    return this.s;
}

Sensor.prototype.onNormValue = function(nval){ //[0 1]
    var val = nval*((this.s.valMax-this.s.valMin)) + this.s.valMin;
    this.onValue(val); //TODO onValue() -> onNormValue()
}

Sensor.prototype.onValue = function(val){
    //console.log("sensor:",this.s.name,val);
    var nv = (val-this.s.valMin)/(this.s.valMax-this.s.valMin);
    this.currValue = val;
    if(this.s.enabled){
        if( this.s.motorEnabledOutput ){
            //var nv = (val-this.s.valMin)/(this.s.valMax-this.s.valMin)
            //console.log("to motor:",this.s.toMotorIndex,nv);
            dxlManager.onNormControl(this.s.toMotorIndex,nv);
        }
        //TODO anims
        if(this.s.animationsEnabledOutput) sensorManager.handleSensorValueForAnims(this.ID,val); 
        if(this.s.oscEnabledOutput) oscManager.sendSensorMessage(this.ID,val);
        if(this.s.mobilizingEnabledOutput){
            //console.log("send sensor:",this.s.name,nv);
            oscMobilizing.sendOSC({
                address:"/mbk/sensor",
                args:[
                    {type:'s',value:this.s.name},
                    {type:'f',value:nv}
                ]
            });
        }
        if(this.s.midiEnabledOutput) {
            midiPortManager.sendMidi(this.s.midiPortOutput,this.s.midiCmdOutput,this.s.midiMappingOutput,nv);
        }
    }
    MisGUI_sensors.setSensorValue(this.ID,val,nv*100);    
}

Sensor.prototype.init = function(){
    switch(this.s.device){
        case "Midi":
            //TODO
            break;
        case "OSC":
            //TODO
            break;
        case "CM9":
            //console.log("-------CM9 addcallback---------");
            //cm9Com.setCallback(+this.s.pin,this.onValue.bind(this));
            break;
        case "Robus":
            //console.log("Robus addcallback");
            robusManager.setCallback(this.s.address,this.s.name,this.onValue.bind(this));
            break;
        case "":
            break;
        default:
            alert("Sensor device unknown\n",this.s.device);
    }
}

Sensor.prototype.onName = function(txt){
    var args = txt.split("/");
    console.log("sensor onName *****************split:",args);
    var changes = 0;
    for(var i=0;i<args.length;i++){
        var kv = args[i].split(":");
        switch(kv[0]){
            case "pin":this.s.cm9Pin=+kv[1];changes++;break;
            case "motor":this.s.toMotorIndexr=+kv[1];changes++;break;
            case "min":this.s.valMin=+kv[1];changes++;break;
            case "max":this.s.valMax=+kv[1];changes++;break;
            case "dev":this.s.device=kv[1];changes++;break;
            case "pos":this.s.fromMotorIndex=+kv[1];changes++;break;
            case "addr":this.s.address=kv[1];changes++;break;
        }
    }
    if(changes>0){
        //console.log("this changed",this.s);
        //cm9Com.removeCallback(+this.s.pin);
        //robusManager.removeCallback(this.s.address,this.s.name);
        this.init();
        //TODO TODO:
        //misGUI.changeSensor(this.s,this.ID);
    }
}

Sensor.prototype.discard = function(){
    this.s.enabled = false; //just in case 
    //cm9Com.removeCallback(+this.s.pin);
    robusManager.removeCallback(this.s.address,this.s.name);   
}

Sensor.prototype.freezeSensor = function(){
    if(this.s.enabled){
        this.freeze = true;
        this.s.enabled = false;
    }
}

Sensor.prototype.unfreezeSensor = function(){
    if(this.freeze){
        this.s.enabled = true;
        this.freeze = false;
    }
}