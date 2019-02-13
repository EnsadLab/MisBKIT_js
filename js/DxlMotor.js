//const luosManager  = require("./LuosManager.js");

//============================================================================
// DXL/sync addr nb id,val,val id,val,val id,val val
// DXL/speeds xxx xxx xxx xxx xxx xxx
// DXL/speed/1 xxx
// DXL/goals xxx xxx -1 xxx xxx xxx
// DXL/sg spd goal spd goal spd goal spd goal spd goal spd goal
// DXL/W 1 addr xxx
// DXL/? 1 addr

//MisBKIT : EW index reg value  (30 goal, 32speed signée ... )
//          MR (read motor) id reg
//          réponse MV index reg value

//TODO how 
const ADDR_MODEL       = 0;
const ADDR_ID          = 3;
const ADDR_CW_LIMIT    = 6;
const ADDR_CCW_LIMIT   = 8;
const ADDR_TORQUE_ENABLE = 24;
const ADDR_LED         = 25;
const ADDR_MARGIN_CW   = 26;
const ADDR_MARGIN_CCW  = 27;
const ADDR_SLOPE_CW    = 28;
const ADDR_SLOPE_CCW   = 29;
const ADDR_GOAL        = 30; //0x1E
const ADDR_SPEED       = 32;
const ADDR_TORQUE      = 34;
const ADDR_POSITION    = 36;
const ADDR_TEMPERATURE = 43;

const DXL_OFF = -1; //RELAX
const DXL_JOINT = 0;
const DXL_WHEEL = 1;
//TODO multitour ...

//module.exports = !!! --> donot use Dxl.prototype.xxxx
class Dxl{
    constructor(index){
        this.m = { //settings
            gate:"cm9",
            alias: "",
            dxlID:0,  //same id param in html/misGUI
            textID:"-", 
            enabled: false,
            model:-1,         //AX12 par defaut
            clockwise:false,  //par defaut
            mode:DXL_OFF,     //0:joint 1:wheel //default=wheel -> no jump at srart
            jointSpeed: 0,    //[-100 100] !!! 0 = speedMax !!!
            angleMin: -150,
            angleMax:  150,
            speedMin: -100,
            speedMax:  100,
            torqueMax: 1023,
            stillAngle: 0,
            //midi:{port:"",msg:"CC:0"} //TODO ? type:"CC" num:0  ? channel:0 ?
        };
        this.index   = index;
        this.ioManager = undefined; //TOTHINK
        this.ioID    = "";
        this.rec = false;
        //this.timeOfRequest = 0;
        this._currPos = NaN; //TOTHINK
        this._curAngle = 0; 
        this.dxlGoal = 512;
        this.wantedAngle  = 0;
        this.dxlSpeed = 0;
        this.wantedSpeed  = 0;
        this.wantedTorque = NaN;
        this._taskCount   = 0;
        this._regRead     = -1;
        this._gotModel    = false;
        this.limitCW      = 0;
        this.limitCCW     = 1023; //AX12
        this.angleRef     = 300;  //AX12
        this.temperature  = 0;
        this.frozen = false;
    }
}
module.exports = Dxl;

//cm9 --> dxlM -> sendGoalSpeed
Dxl.prototype.sendGoalSpeed = function(){
    if(this.m.dxlID>0){
        var mod = DXL_OFF; //relax par default
        var s = 0;
        if(this.m.enabled){
            if(this.temperature>65)
                this.onoff(false);
            if(!this.frozen){
                mod=this.m.mode;
                s = this.dxlSpeed;
                //console.log("sendGoalSpeed: frozen",mod)
            }
            //console.log("sendGoalSpeed:",mod)
        }
        cm9Com.pushMessage(
            "dxlMotor"+this.index+" "+this.m.dxlID
            +","+mod+","+s+","+this.dxlGoal+"\n"
        );
    }
    else{
        cm9Com.pushMessage("dxlMotor"+this.index+" 0\n");
        console.log("PUSH 0:",this.index);
    }
}

//DELETED Dxl.prototype.getWanted=function(){
//DELETED Dxl.prototype.getGoal= function(){
//DELETED Dxl.prototype.getSpeed= function(){

Dxl.prototype.pos2angle=function(p){
    var a = ((p/this.limitCCW)-0.5)*this.angleRef;
    if ( !this.m.clockwise) return -a;  //inversé !
    return a;
}

Dxl.prototype.angle2pos=function(a){
    if(!this.m.clockwise) a=-a; //inversé !
    //default: AX12
    if( (this.m.model==12)||(this.m.model==-1) )
        return (512 +(a * 511.5 / 150))|0; //AX12 or unknown
    else
        return (2048 +(a * 2048 / 180))|0; //MX28 ...
}

//TODELETE
/*
Dxl.prototype.onAddr=function(addr,val){
    switch(addr){
        case ADDR_MODEL:
            if(val>=0){
                this.model(val);
                this._gotModel = true;
            }
            break;
        case ADDR_POSITION:
            var a = this.pos2angle(val);
            this._curAngle = a;
            this._currPos  = val;
            break;
        default:
            console.log("DXLREG? ",reg," ",val);
    }
}
*/

//DELETED Dxl.prototype.delayMotorON = function(){
//DELETED Dxl.prototype.pushSerialMsg = function(stack){
//DELETED Dxl.prototype.sendMode = function(jw){ //0:joint 1:wheel

Dxl.prototype.copySettings = function(dxl){
    if(dxl.m){ //copy from a Dxl
        for(var e in dxl.m){
            this.m[e]=dxl.m[e];
            //console.log("copySettings:",this.m[e]);
        }
    }
    else{ //copy from settings
        for(var e in dxl){
            //console.log("***copySettings:",e,typeof(this.m[e]));
            if(typeof(this.m[e])=='number')
                this.m[e]=+dxl[e];
            else            
                this.m[e]=dxl[e]; //!!! allow adding setting !!!
            //console.log("***copySettings:",e,this.m[e]);
        }        
    }
    if(this.m.id==0)this.m.id=this.m.dxlID; //m.id deprecated
    else if(this.m.dxlID==0)this.m.dxlID=this.m.id;
    if(this.m.dxlID==undefined)this.m.dxlID=0; //gasp
    //console.log("***copySettings:",this.m);
}

Dxl.prototype.getSettings=function(){
    return this.m;
}

Dxl.prototype.update = function(t){ 
    if( this.m.dxlID>0){
        if( this.m.mode==DXL_WHEEL ){ //||((this.m.mode==DLX_OFF) )
            this.wantedAngle = this._curAngle;
        }
        else if(!this.m.enabled){
            if(this._currPos != NaN){
                this.dxlGoal = this._currPos;
            }
            if(this._curAngle != undefined){ //????
                this.wantedAngle = this._curAngle;
                misGUI.motorAngle(this.index,this.wantedAngle);
            }
        }
        
        //REDO gate cm9_luos
        if(this.m.enabled) {
            if(this.m.gate == "luos"){
                if(this.m.mode==DXL_JOINT){
                    var a = (this.m.clockwise)? this.wantedAngle : this.wantedAngle;
                    console.log("Angle:",a)
                    luosManager.command(this.ioID,"setPosition",a);
                }
                else{
                    var s = (this.m.clockwise)? +this.wantedSpeed : -this.wantedSpeed;
                    console.log("Speed:",typeof(this.wantedSpeed),s)
                    luosManager.command(this.ioID,"setPower",s);
                }
            }
        }

        if (this.m.clockwise) misGUI.needle(this.index,this._curAngle);
        else misGUI.needle(this.index,-this._curAngle);
    }
    return true;
}

Dxl.prototype.cm9Init = function() {
    if(this.m.dxlID<1)
        return;
    
    if(this.m.enabled)
        this.enable(true);
}

Dxl.prototype.dxlID = function(id){
    this.enable(false);

    if(+id != this.m.dxlID){
        this.temperature = 0;
        this.m.model = -1; 
        this._gotModel = false;
    }
    this.m.id = +id;    //id deprecated
    this.m.dxlID = +id; // same as html param >>> misGUI
    
    if(this.m.dxlID>0){
        this.m.textID = "cm9_"+id;
        if( this._gotModel == false){
            cm9Com.pushMessage("dxlModel "+this.m.dxlID+"\n");
        }
    }
    else{
        this.m.textID = "-"
    }

    return this;
};


Dxl.prototype.model=function(val){
    console.log("------ model:[",this.index,"]-------",val);
    switch(val){
        case -1:
            //no answer ... disable , ask again ?
            break;
        case 12: //AX12
            this.m.model = val;
            this.limitCCW = 1023;
            this.angleRef  = 300;
            this._gotModel = true;
            cm9Com.pushMessage(
                "dxlWrite "+this.m.dxlID+","+ADDR_SLOPE_CW+",128\n"
               +"dxlWrite "+this.m.dxlID+","+ADDR_SLOPE_CCW+",128\n"); //smooth
            break;

        //case -1: //!!!MX28 par defaut, becoz RS485
        case 29: //MX28
            this._gotModel = true;
            this.m.model = val;
            this.limitCCW = 4095;
            this.angleRef  = 380;
            break;
        default: //MX64 MX106 ..
            this._gotModel = true;
            this.m.model = val;
            this.limitCCW = 4095;
            this.angleRef  = 380;
            break;
    }
}

Dxl.prototype.enable = function(onoff){
    console.log("-------- Dxl.Enable(): -------",this.m.dxlID,onoff);

    if(this.m.dxlID<1){
        this.m.enabled = false;
        misGUI.dxlEnabled(this.index,false);
        return false;
    }

    //AREVOIR MODE
    if(onoff){
        if(this.temperature>66){
            console.log("***** TO HOT ****",this.index);
            this.m.enabled = false;
        }
        else{
            //console.log("-------- Dxl.Enable: -------",this.m.dxlID,onoff," model:",this.m.model);
            if(this.m.model==-1){ //ask for model
                console.log("-----------askForModel:",this.m.dxlID);
                cm9Com.pushMessage("dxlModel "+this.m.dxlID+"\n");
            }
            this.m.enabled = true;
            if(this.m.mode==DXL_JOINT)
                this.joint();
            else if(this.m.mode==DXL_WHEEL)
                this.wheel();
        }
    }
    else{ //mode wheel pour "relax" AX12 ... torque ... //A REVOIR!!! MX28...
        //console.log("----- Dxl.disable: -----",this.m.dxlID);
        this.m.enabled = false;
        this.dxlSpeed = 0;
        this.wantedSpeed = 0;
        misGUI.motorSpeed(this.index,0);

        //TORQUE ?
    }
    if(this.m.gate == "luos")//luos
        luosManager.command(this.ioID,"setCompliant",!onoff);

    return onoff;
}

Dxl.prototype.stopMotor = function(){
    console.log("NEW STOP MOTOR");
    if(this.m.enabled){
        this.enable(false); //STOP
        this.enable(true);  //REENABLE
    }
}

Dxl.prototype.freezeMotor = function(){
    if(this.m.enabled){
        this.frozen = true;
        this.enable(false);
        console.log("freeeeeeeeeze:",this.index,this.enabled);
    }
}

Dxl.prototype.unfreezeMotor = function(){
    if(this.frozen){
        this.frozen = false;
        this.enable(true);
        console.log("unfreeeeeeeeeze:",this.index,this.m.enabled);
    }
}

Dxl.prototype.angleRange = function(min,max){
    this.m.angleMin = +min;
    this.m.angleMax = +max;
    return this;
};

Dxl.prototype.joint = function(){
    this.m.mode = DXL_JOINT;
    this.m.jointSpeed = this.m.speedMax; //OK: good solution
    if(this._currPos != NaN)
        this.wantedAngle = this._curAngle

    this.speed(this.m.jointSpeed);
    misGUI.motorAngle(this.index,this.wantedAngle); //updated by currPos
    console.log("----- Dxl.joint: ----",this.index,this.m.mode,this._curAngle);
    console.log("     _currpos:",this._currPos,this._curAngle,this.wantedAngle)
    // let the animations know about the change so that the label can be changed
    animManager.setTrackForRecord(this.index,this.m.mode);
    if(this.m.dxlID>0){
        if(this.m.gate=="cm9"){
            if(this.m.model==-1){ //ask for model
                cm9Com.pushMessage("dxlModel "+this.m.dxlID+"\n");
            }
            if(this.m.model==12){
                cm9Com.pushMessage( //compliance max
                    "dxlWrite "+this.m.dxlID+","+ADDR_SLOPE_CW+",128\n"
                    +"dxlWrite "+this.m.dxlID+","+ADDR_SLOPE_CCW+",128\n"); //smooth
            }
        }
        else if(this.m.gate=="luos"){
            luosManager.command(this.ioID,"modeJoint",this.m.jointSpeed,this.wantedAngle);
        }
    }
    return this;
};

Dxl.prototype.wheel = function(){
    this.m.mode = DXL_WHEEL;
    this.dxlSpeed = 0;
    this.wantedSpeed = 0;
    animManager.setTrackForRecord(this.index,this.m.mode);
    if(this.m.gate=="luos"){
        luosManager.command(this.ioID,"modeWheel");
    }
    return this;
};

Dxl.prototype.angleToNorm = function(a){ //[0 1]
    return (a-this.m.angleMin)/(this.m.angleMax-this.m.angleMin);
}

//setCurrpos , returns angle
Dxl.prototype.currPos = function(p){ //p=dynamixel position
    if(p>=0) {
        var a = this.pos2angle(p);
        this._curAngle = a;
        this._currPos = p;

        if( this.m.mode==DXL_WHEEL ){ //||((this.m.mode==DLX_OFF) )
            this.wantedAngle = a;
            this.dxlGoal = p;
        }
        else if(!this.m.enabled){
            this.wantedAngle = a; 
            this.dxlGoal = p;
            misGUI.motorAngle(this.index,a);
        }
        return a;
    }
    return this.wantedAngle;
}

Dxl.prototype.getCurrentAngle = function(){
    return this._curAngle;
}

Dxl.prototype.setCurrentAngle=function(angle){
    var a = +angle;
    var p = this.angle2pos(a);
    this._curAngle = a;
    this._currPos = p;
}


//val = angle ou speed en fonction du mode courant 
Dxl.prototype.onValue =function(val){ //angle en°  ou  speed[0-100]
    if(this.m.mode==0) {
        this.angle(val);
        misGUI.motorAngle(this.index,val );
    }
    else {
        this.speed(val);
        misGUI.motorSpeed(this.index,val);
    }
}

//val = angle ou speed en fonction du mode courant 
Dxl.prototype.onNormValue =function(val){ //angle  ou  speed normalisé
    if(val<0)val=0;
    if(val>1)val=1;
    if(this.m.mode==0) {
        misGUI.motorAngle(this.index, this.nAngle(val) );
    }
    else {
        misGUI.motorSpeed(this.index, this.nSpeed(val) );
    }
}

Dxl.prototype.angle = function(a){
    if(a!=undefined) {
        if (a > this.m.angleMax) a = this.m.angleMax;
        else if (a < this.m.angleMin) a = this.m.angleMin;
        this.wantedAngle  = a;
        this.dxlGoal = this.angle2pos(a);
        //console.log("DXL:angle:",this.m.gate,a,this.wantedAngle);
        return a;
    }
    else {
        return this.wantedAngle;
    }
};

// [0 n 1]
Dxl.prototype.nAngle = function( n) {
    //console.log("nangle:",n," min:",this.m.angleMin," max:",this.m.angleMax);
    if(n<0)n=0;
    else if(n>1)n=1.0;
    //console.log("nangle:",this.m.angleMin + n*(this.m.angleMax - this.m.angleMin));
    //console.log("nangle:",((this.m.angleMax - this.m.angleMin)*n + this.m.angleMin) );
    return this.angle( (this.m.angleMax - this.m.angleMin)*n + this.m.angleMin );
};

Dxl.prototype.speed = function(s){
    if(s!=undefined) {
        if (s > this.m.speedMax)s = this.m.speedMax;
        else if (s < this.m.speedMin)s = this.m.speedMin;
        this.wantedSpeed = s; 

        var v = (s*1023/100)|0;
        if(!this.m.clockwise) v=-v; //inversé
        //if(v<0) v = 1024-v; //!!! SUR LE CM9 !!!
        this.dxlSpeed = v;    
        return s;
    }
    else{
        console.log("***** Dxl.spped READ? ******");
        return this.wantedSpeed;
    }
};

//speed normalisée [0,1] !!! 'nospeed' depends on min max 
Dxl.prototype.nSpeed = function(s) {
    if(s>1)s=1.0;
    else if(s<0)s=0;
    return this.speed(this.m.speedMin + s * (this.m.speedMax - this.m.speedMin) );
};

Dxl.prototype.clockwise = function(val){
    if(typeof(val)=='string')val=(val=="CCW");
    if(typeof(val)=='number')val=(val!=0);

    if( val != this.m.clockwise ){ //mmm , do it more sure
        this.wantedAngle = -this.wantedAngle;
        misGUI.motorAngle(this.index,this.wantedAngle); //updated by currPos
    }

    console.log("DXL.clockwise:",this.m.clockwise, val);
    this.m.clockwise = val; //0:CW 1:CCW , inversion GUI-dxl
}

Dxl.prototype.angleMin = function(val){
    //console.log("Dxl.angleMin:",this.index,this.m);
    this.m.angleMin = val;
    return this;
};

Dxl.prototype.angleMax = function(val){
    this.m.angleMax = val;
    return this;
};

Dxl.prototype.speedMin = function(val){
    //console.log("DXL-speedMin",val);
    this.m.speedMin = val;
    return this;
};

Dxl.prototype.speedMax = function(val){
    //console.log("DXL-speedMax:",val);
    this.m.speedMax = val;
    this.m.jointSpeed = val;
    if(this.m.mode == DXL_JOINT)
        this.speed(val);
    return this;
};

Dxl.prototype.goStill = function(){
    if(this.m.mode == DXL_JOINT){
        this.angle(this.m.stillAngle)
        console.log("stillAngle:",this.m.stillAngle)
        misGUI.motorAngle(this.index,this.m.stillAngle );
    }
    else{
        console.log("stillAngle:",0)
        this.speed(0);
        misGUI.motorSpeed(this.index,0 );
    }
}

Dxl.prototype.setStillAngle = function(val){
    if(typeof(val)=='number')
        this.m.stillAngle = val;
    else
        this.m.stillAngle = this.wantedAngle;
    console.log("setStillAngle:",this.m.stillAngle)
}


