/**
* Created by Cecile on 24/07/17.
*/

MotorMapping = function () {
    
    this.m = { //settings
        type:"",
        enabled: true,
        motorID:-1,
        port:-1,
        cmd:"", 
        nbID:-1,
        valMin: -1,
        valMax: -1
    };

};


MotorMapping.prototype.copySettings = function(s){
    for(var e in s){
        this.m[e]=s[e];
    }
}

MotorMapping.prototype.getSettings = function(){
    return this.m;
}