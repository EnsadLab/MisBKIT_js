/**
* Created by Cecile on 27/07/17.
*/

Sensor = function () {

    this.s = { //settings
        device: "", //Didier Midi,CM9,Robus,OSC,Mike ...
        name:"",
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