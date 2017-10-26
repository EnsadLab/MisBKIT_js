/**
* Created by Cecile on 27/07/17.
*/


Sensor = function () {

    this.s = { //settings
        device: "",      //(Didier) Midi,CM9,Robus,OSC,Mike ...
        address: "",     //(Didier) example for Robus "octo_wifi"
        name:"",         //(Didier) example Pour robus "octo_portard2"
        pin:-1,
        enabled: true,
        threshold:-1,
        tolerance:-1,
        valMin: -1,
        valMax: -1,
        anim1: "", //TODO: change later in an array or not?
        anim2: "",
        motorIndex: 2,      
        angleIndex: -1 
    };

    this.currValue = -1;
    this.ID = -1;
    this.area = -1; // -1:nowhere, 0:before the threshold, 1:after the threshold
    this.oldArea = -1;

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

Sensor.prototype.onValue = function(val){
    //console.log("sensor:",this.s.name,val);
    var nv = (val-this.s.valMin)/(this.s.valMax-this.s.valMin);
    misGUI.setSensorValue(this.ID,val,nv*100);
    this.currValue = val;
    if(this.s.enabled){
        if(this.s.motorIndex>=0){
            //var nv = (val-this.s.valMin)/(this.s.valMax-this.s.valMin)
            dxlManager.onNormControl(this.s.motorIndex,nv);
        }
        //TODO anims
        sensorManager.handleSensorValue(this.ID,val); 
    }
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
    //console.log("*****************split:",args);
    var changes = 0;
    for(var i=0;i<args.length;i++){
        var kv = args[i].split(":");
        switch(kv[0]){
            case "pin":this.s.pin=+kv[1];changes++;break;
            case "motor":this.s.motorIndex=+kv[1];changes++;break;
            case "min":this.s.valMin=+kv[1];changes++;break;
            case "max":this.s.valMax=+kv[1];changes++;break;
            case "dev":this.s.device=kv[1];changes++;break;
            case "pos":this.s.angleIndex=+kv[1];changes++;break;
            case "addr":this.s.address=kv[1];changes++;break;
        }
    }
    if(changes>0){
        //console.log("this changed",this.s);
        //cm9Com.removeCallback(+this.s.pin);
        //robusManager.removeCallback(this.s.address,this.s.name);
        this.init();
        misGUI.changeSensor(this.s,this.ID);
    }
}

Sensor.prototype.discard = function(){
    //cm9Com.removeCallback(+this.s.pin);
    robusManager.removeCallback(this.s.address,this.s.name);   
}