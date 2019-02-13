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
        filter: "default",
        oscEnabledInput: false,
        oscAdressInput: "",
        oscAdressOutput: "",
        oscEnabledOutput: false,
        mobilizingEnabledInput: false,
        mobilizingEnabledOutput: false,
        midiEnabledInput: false,
        midiPortInput: "???",
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
        luosEnabledInput: false,
        luosInputParams: {gate:"none",alias:"none",pin:"none"},
        sinusEnabledInput: false,
        //sinusParams: {period:5,offset:0,current:0},
        sinusParams: {amplitude:1.0,offset:0.0,period:1.0,current:0},
        randomEnabledInput: false,
        //randomParams: {type:"simple",step:0,periodMin:1,periodMax:5,v1min:0,v1max:100,v2min:0,v2max:100},
        randomParams: {valmin:0,valmax:100,intmin:2,intmax:5},
        inputEnabled: false, //TODO?
        //inputParams: TODO ?
        ID_gui: -1,
        input_entry: "",
        output_entries:[],
        alpha: 0.5,
        distanceSensorEnabledInput: false,
        lightSensorEnabledInput: false,
    };

    //Suggestion: an object by input ...
    //   cm9:{ enabled:false , val:7 },

    this._tmpValue = undefined;  
    this.currValue = 0;
    this.normValue = 0;
    this.outValue   = 0;
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
    this.oldVal = 0;
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
    //this.onValue(val);
    this.currValue = val;
}

Sensor.prototype.onValue = function(val){
    this.currValue = val;
}

//Sensor.prototype.onValue = function(val){
//TODO : sinus & random may use update
Sensor.prototype.update = function(){
    if(!this.s.enabled)
        return;

    if(this.s.luosEnabledInput){
        var val = luosManager.getValue(this.s.luosInputParams);
        if(val!=undefined)
            this.currValue = val;
    }

    var val = this.currValue;
        //console.log("sensor:",this.s.name,val);

    //CECILE2:  le filtre au début : on veut une valeur filtrée !
    // oui, juste!! fallait juste le rajouter...


    var nv = (val-this.s.valMin)/(this.s.valMax-this.s.valMin);
    var fval = val;
    if(this.s.filter == "lowpass"){
        fval = this.lowPassFilter(val); 
    } 
    var fnv = (fval-this.s.valMin)/(this.s.valMax-this.s.valMin);
 
    //this.currValue = fval; // utiliser fval plutôt que val
    this.normValue = fnv; // utiliser fnv plutôt que nv
    if(this.s.enabled){
        if( this.s.motorEnabledOutput ){
            //var nv = (val-this.s.valMin)/(this.s.valMax-this.s.valMin)
            //console.log("to motor:",this.s.toMotorIndex,nv);
            dxlManager.onNormControl(this.s.toMotorIndex,fnv);
        }
        //TODO anims
        if(this.s.animationsEnabledOutput) sensorManager.handleSensorValueForAnims(this.ID,fval); 
        if(this.s.oscEnabledOutput) {
            //TODO DIDIER2: envoyer OSC...
            //DONE: je choisi d'envoyer la valeur normalisée ... GUI?
            oscManager.send(this.s.oscAdressOutput,[fnv])
        }
        if(this.s.mobilizingEnabledOutput){
            //console.log("send sensor:",this.s.name,nv);
            /* TODO (TO REDO)
            oscMobilizing.sendOSC({
                address:"/mbk/sensor",
                args:[
                    {type:'s',value:this.s.name},
                    {type:'f',value:fnv}
                ]
            });
            */
        }
        if(this.s.midiEnabledOutput) {
            //console.log("midiEnabledOutput",this.s.midiMappingOutput);
            midiPortManager.sendMidi(this.s.midiPortOutput,this.s.midiCmdOutput,this.s.midiMappingOutput,nv);
        }


    }
    
    // here we update the value in the gui. We need the value, the filtered value and the percentage
    //DIDIER: moved on top : 
    /*
    var fval = val;
    if(this.s.filter == "lowpass"){
        fval = this.lowPassFilter(val); 
    } 

    // TODO DIDIER2: si tu veux implémenter un autre filtre!! -> index.html ligne 947 ("anotherfilter")
    
    //console.log("val",val,"fval",fval);
    var fnv = (fval-this.s.valMin)/(this.s.valMax-this.s.valMin);
    */
    //console.log("val",val,"fval",fval);

    this.outValue = fval;
    MisGUI_sensors.setSensorValue(this.ID,val,nv*100.0,fval,fnv*100.0);    
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
            //robusManager.setCallback(this.s.address,this.s.name,this.onValue.bind(this));
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
                p.offset = +p.offset;
                p.amplitude = +p.amplitude;
                //p.offset = p.current; //starts where it stopped //CEC: huh?
                p.current = +p.current;
                this.inputTime = Date.now();
                this.inputInterval = setInterval(this.sinusUpdate.bind(this),50);
            }
            break;
        case "random":
            this.s.randomEnabledInput = onoff;
            if(onoff){
                var p = this.s.randomParams;
                //string to num
                //p.periodMin = +p.periodMin; p.periodMax = +p.periodMax;
                //p.v1min = +p.v1min; p.v1max = +p.v1max;
                //p.v2min = +p.v2min; p.v2max = +p.v2max;
                //p.step = 0;
                p.valmin = +p.valmin;
                p.valmax = +p.valmax;
                p.intmin = +p.intmin;
                p.intmax = +p.intmax;
                this.inputTime = Date.now();
                //this.inputTimer = setTimeout(this.updateRandom.bind(this),p.periodMin*1000);
                this.inputTimer = setTimeout(this.updateRandom.bind(this),p.intmin*1000);
                //console.log("RANDOM STARTED:",this.s.randomParams.periodMin*1000);
                console.log("RANDOM STARTED:",this.s.randomParams.intmin*1000);
            }
            else
            console.log("RANDOM STOPPED:",this.s.randomParams.periodMin*1000);
            
            break;
    }
}

// sinus: param[0]: offset, param[1]: Frequency, param[2]: amplitude[0.0,1.0]
Sensor.prototype.sinusUpdate = function(){
    var p = this.s.sinusParams;
    var dt = (Date.now()-this.inputTime)*0.001;

    this.sinusTimer += 0.2;
    //var a = this.sinusTimer;
    var v = p.amplitude*Math.sin(Math.PI*2.0*dt*p.period) + p.offset; // melange entre periode et fréquence... dernière minute... pour que cela que c'est une * et non une division
    var nv = v*0.5 + 0.5;
    this.onNormValue(nv);
}


/* previous version from Didier
Sensor.prototype.sinusUpdate = function(){
    //if(this.s.sinusEnabledInput){ //TOTHINK
        var p = this.s.sinusParams;
        var dt = (Date.now()-this.inputTime)*0.001;
        var a = Math.PI*dt*2/p.period + p.offset;
        p.current = a;
        var v = Math.sin(a)*0.5+0.5;
        this.onNormValue(v);
        //console.log("val:",v);
    //}    
}*/


/*
Sensor.prototype.interpole = function(){
    var t=Date.now();
    var dt = t-this.interpoleTime
}
*/

Sensor.prototype.updateRandom = function(){
    var p = this.s.randomParams;  
    var v = Math.random()*(p.valmax-p.valmin)+p.valmin;
    var t = Math.random()*(p.intmax-p.intmin)+p.intmin;
    this.onValue(v);
    this.inputTimer = setTimeout(this.updateRandom.bind(this),t*1000);
}

/* previous version from Didier
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
*/

Sensor.prototype.lowPassFilter = function(v) {
    this.s.alpha = +this.s.alpha; // faudrait le faire ailleurs........
    if(this.s.alpha < 0) this.s.alpha = 0.0;
    else if(this.s.alpha > 1.0) this.s.alpha = 1.0;
    //console.log("----> lowpass filter, alpha: ",this.s.alpha, " oldVal:",this.oldVal,"v:",v);
    var newVal = this.oldVal + this.s.alpha * (v-this.oldVal);
    newVal = parseFloat(newVal.toFixed(5)); // very important, but of course the number of decimals can be changed. When values are super small, it is not intepreted correctly.
    this.oldVal = newVal;
    return newVal;
}

