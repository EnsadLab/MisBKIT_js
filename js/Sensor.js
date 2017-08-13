/**
* Created by Cecile on 27/07/17.
*/

Sensor = function () {

    this.s = { //settings
        device: "",      //(Didier) Midi,CM9,Robus,OSC,Mike ...
        address: "",     //(Didier) example for Robus "octo_wifi"
        name:"",         //(Didier) example Pour robus "octo_portard2"
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

Sensor.prototype.onValue = function(val){
    this.currValue = val;
    console.log("sensor:",this.name,val);

}

Sensor.prototype.init = function(){
    console.log("!------sensors[i].init");    
    switch(this.s.device){
        case "Midi":
            //TODO
            break;
        case "OSC":
            //TODO
            break;
        case "CM9":
            //TODO
            break;
        case "Robus":
            console.log("addr:",this.s.address);
            robusManager.setCallback(this.s.address,this.s.name,this.onValue.bind(this));
            break;
        case "":
            break;
        default:
            alert("Sensor device unknown\n",this.s.device);
    }
}