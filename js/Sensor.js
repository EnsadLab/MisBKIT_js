/**
* Created by Cecile on 27/07/17.
* Mofified by Didier:
*
*/


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
        robusEnabledInput: false,
        robusInputParams: {gate:"gate",module:"",pin:""},
        sinusEnabledInput: false,
        sinusParams: {period:5,offset:0,current:0},
        randomEnabledInput: false,
        randomParams: {type:"simple",step:0,periodMin:1,periodMax:5,v1min:0,v1max:100,v2min:0,v2max:100},
        inputEnabled: false, //TODO?
        //inputParams: TODO ?
        ID_gui: -1,
        input_entry: "",
        output_entries:[]
    };

    //Suggestion:
    //   cm9:{ enabled:false , val:7 },


    this.currValue = -1;
    this.normValue = 0;
    this.ID = -1;
    this.area = -1; // -1:nowhere, 0:before the threshold, 1:after the threshold
    this.oldArea = -1;
    this.freeze = false;

    this.freeze = true;
    this.enabled = false; //TODO TODO: check all this different enabled...??
    this.textDescription = "";

    this.inputInterval = undefined;
    this.inputTimer = undefined;
    this.inputTime  = 0;
};
module.exports = Sensor;

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
    this.normValue = nv;
    if(this.s.enabled){
        if( this.s.motorEnabledOutput ){
            //var nv = (val-this.s.valMin)/(this.s.valMax-this.s.valMin)
            //console.log("to motor:",this.s.toMotorIndex,nv);
            dxlManager.onNormControl(this.s.toMotorIndex,nv);
        }
        //TODO anims
        if(this.s.animationsEnabledOutput) sensorManager.handleSensorValueForAnims(this.ID,val); 
        if(this.s.oscEnabledOutput) oscManager.sendSensorMessage(this.ID,nv);
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
    //robusManager.removeCallback(this.s.address,this.s.name);   
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


//DELETED sinusOnOff   //
//DELETED randomOnOff  //switch n'est pas bien mieux !? à voir ... classes

Sensor.prototype.inputOnOff = function(onoff){ //Didier
    console.log("inputOnOff:",this.s.input_entry,onoff);

    clearInterval(this.inputInterval);
    clearTimeout(this.inputTimer);

    switch(this.s.input_entry){
        case "sinus":
            if(onoff){
                var p = this.s.sinusParams;
                p.period = +p.period;
                p.offset = p.current; //starts where it stopped
                this.inputTime = Date.now();
                this.inputInterval = setInterval(this.sinusUpdate.bind(this),50);
            }
            break;
        case "random":
            this.s.randomEnabledInput = onoff;
            if(onoff){
                var p = this.s.randomParams;
                //string to num
                p.periodMin = +p.periodMin; p.periodMax = +p.periodMax;
                p.v1min = +p.v1min; p.v1max = +p.v1max;
                p.v2min = +p.v2min; p.v2max = +p.v2max;
                p.step = 0;
                this.inputTime = Date.now();
                this.inputTimer = setTimeout(this.updateRandom.bind(this),p.periodMin*1000);
                console.log("RANDOM STARTED:",this.s.randomParams.periodMin*1000);
            }
            else
            console.log("RANDOM STOPPED:",this.s.randomParams.periodMin*1000);
            
            break;
    }
}

Sensor.prototype.sinusUpdate = function(){
    //if(this.s.sinusEnabledInput){ //TOTHINK
        var p = this.s.sinusParams;
        var dt = (Date.now()-this.inputTime)*0.001;
        var a = Math.PI*dt*2/p.period + p.offset;
        p.current = a;
        var v = Math.sin(a)*0.5+0.5;
        this.onNormValue(v);
    //}    
}


/*
Sensor.prototype.interpole = function(){
    var t=Date.now();
    var dt = t-this.interpoleTime
}
*/

Sensor.prototype.updateRandom = function(){ //randomEnabledInput enabled when switched to CM9 !
    //console.log("RANDOM updateRandom:",this.s.input_entry,this.s.randomEnabledInput);
    if((this.s.randomEnabledInput)&&(this.s.input_entry=="random")){
        var p = this.s.randomParams;  
        var t = Math.random()*(p.periodMax-p.periodMin)+p.periodMin;
        var v;
        if( p.step == 0 ){
            this.onValue(Math.random()*(p.v1max-p.v1min)+p.v1min);
        }
        else{
            this.onValue(Math.random()*(p.v2max-p.v2min)+p.v2min);
        }
        this.inputTimer = setTimeout(this.updateRandom.bind(this),t*1000);
        p.step ^= 1;
    }
}

