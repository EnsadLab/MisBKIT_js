/**
* Created by Cecile on 24/07/17.
*/

MotorMapping = function () {
    
    this.m = { //settings
        //type:"",
        enabled: true,
        motorIndex:-1,
        port:"",
        cmd:"", 
        nbID:-1
        //valMin: -1,
        //valMax: -1
    };

    this.active = false;

};


MotorMapping.prototype.copySettings = function(s){
    for(var e in s){
        this.m[e]=s[e];
    }
}

MotorMapping.prototype.getSettings = function(){
    return this.m;
}