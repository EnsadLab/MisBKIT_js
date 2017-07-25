/**
* Created by Cecile on 24/07/17.
*/

MotorMapping = function () {
    
    this.m = { //settings
        motorID:-1,
        port:-1,
        type:"", 
        nbID:-1,
        valMin: -1,
        valMax: -1
    };

    this.enabled = true;

};


MotorMapping.prototype.copySettings = function(s){
    for(var e in s){
        this.m[e]=s[e];
    }
}