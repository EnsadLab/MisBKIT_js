/**
* Created by Cecile on 27/07/17.
*/

Sensor = function () {

    this.s = { //settings
        device: "",      //(Didier) Midi,CM9,Robus,OSC,Mike ...
        name:"",         //(Didier) example Pour robus "octo_wifi:octo_portard2"
        enabled: true,
        threshold:-1,
        tolerance:-1,
        valMin: -1,
        valMax: -1,
        anim1: "", //TODO: change later in an array or not?
        anim2: "",        
    };

    this.currValue = -1;


};

Sensor.prototype.copySettings = function(s){
    for(var e in s){
        this.s[e]=s[e];
    }
}

Sensor.prototype.getSettings = function(){
    return this.s;
}

Sensor.prototype.onRobusValue = function(val){
    this.currValue = val;

}

Sensor.prototype.initRobus = function(){
    var spl = this.name.split[":"];
    //Todo? spl à verifier
    robusManager.setCallback(spl[0],spl[1],this.onRobusValue.bind(this));
}