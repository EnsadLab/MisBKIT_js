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

const DXL_OFF = -1; //RELAX
const DXL_JOINT = 0;
const DXL_WHEEL = 1;
//TODO multitour ...

//module.exports = !!! --> donot use Dxl.prototype.xxxx
class Dxl{
    constructor(index){
        this.m = { //settings
            //index: index,
            //id:0,     //TODO: remove
            dxlID:0,  //same id param in html/misGUI 
            enabled: false,
            model:-1, //AX12 par defaut
            clockwise:true,
            mode:DXL_OFF, //0:joint 1:wheel //default=wheel
            jointSpeed: 0, //[-100 100] !!! 0 = speedMax !!!
            angleMin: -150,
            angleMax: 150,
            speedMin: -100,
            speedMax: 100,
            torqueMax: 1023,
            midi:{port:"",msg:"CC:0"}
        };

        this.index   = index;
        this.enabled = false;
        this.rec = false;
        this.timeOfRequest = 0;
        this._currPos = NaN;
        this._curAngle = 0; 
        this.dxlGoal = 512;
        this.wantedAngle  = 0;
        this.dxlSpeed = 0;
        this.wantedSpeed  = 0;
        this.wantedTorque = NaN;
        this._taskCount = 0;
        this._regRead = -1;
        this._gotModel = false;
        this.limitCW  = 0;
        this.limitCCW = 1023; //AX12
        this.angleRef  = 300; //AX12
        this.temperature = 0;
        this.freeze = false;
    }
}
module.exports = Dxl;

Dxl.prototype.sendGoalSpeed = function(){
    if(this.m.dxlID>0){
        var mod = DXL_OFF; //relax par default
        var s = 0;
        if(this.enabled){
            if(this.temperature>65)
                this.onoff(false);
            mod=this.m.mode;
            s = this.dxlSpeed;
        }
        cm9Com.pushMessage(
           "dxlMotor"+this.index+" "+this.m.dxlID
          +","+mod+","+s+","+this.dxlGoal+"\n"
        );
    }
    else{
        cm9Com.pushMessage("dxlMotor"+this.index+" 0\n");
    }
}

//DELETED Dxl.prototype.getWanted=function(){
//DELETED Dxl.prototype.getGoal= function(){
//DELETED Dxl.prototype.getSpeed= function(){

Dxl.prototype.pos2angle=function(p){
    var a = ((p/this.limitCCW)-0.5)*this.angleRef;
    if (this.m.clockwise) return -a;
    return a;
}

Dxl.prototype.angle2pos=function(a){
    if(this.m.clockwise) a=-a;
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
            this.m[e]=dxl[e]; //allow adding setting
            //console.log("***copySettings:",e,this.m[e]);
        }        
    }

    if(this.m.id==0)this.m.id=this.m.dxlID; //m.id deprecated
    else if(this.m.dxlID==0)this.m.dxlID=this.m.id;
}

Dxl.prototype.getSettings=function(){
    return this.m;
}

Dxl.prototype.update = function(t){
    
    if(this.m.dxlID>0) {
        /*
        if (this._regRead >= 0) { //TODO dxlRead id addr 
            this._taskCount++;
            if((this._taskCount & 7)==0) {
                cm9Com.pushMessage("dxlR " + this.m.dxlID + "," + this._regRead + ",\n")
                if (++this._regRead >= 48)
                    this._regRead = -1;
            }
        }
        */
    }

    return true;
}

Dxl.prototype.cm9Init = function() {
    if(this.m.dxlID<1)
        return;
    
    if(this.enabled)
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
        if( this._gotModel == false){
            cm9Com.pushMessage("dxlModel "+this.m.dxlID+"\n");
        }
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
        this.enabled = false;
        misGUI.dxlEnabled(this.index,false);
        return false;
    }

    //AREVOIR MODE
    if(onoff){
        if(this.temperature>67){
            console.log("***** TO HOT ****",this.index);
            this.enabled = false;
        }
        else{
            //console.log("-------- Dxl.Enable: -------",this.m.dxlID,onoff," model:",this.m.model);
            if(this.m.model==-1){ //ask for model
                console.log("-----------askForModel:",this.m.dxlID);
                cm9Com.pushMessage("dxlModel "+this.m.dxlID+"\n");
            }
            this.enabled = true;
            if(this.m.mode==DXL_JOINT)
                this.joint();
            else if(this.m.mode==DXL_WHEEL)
                this.wheel();
        }
    }
    else{ //mode wheel pour "relax" AX12 ... torque ... //A REVOIR!!! MX28...
        //console.log("----- Dxl.disable: -----",this.m.dxlID);
        this.enabled = false;
        this.dxlSpeed = 0;
        this.wantedSpeed = 0;
        misGUI.motorSpeed(this.index,0);
        //TORQUE ?
    }
    return onoff;
}

Dxl.prototype.stopMotor = function(){
    console.log("NEW STOP MOTOR");
    if(this.enabled){
        this.enable(false); //STOP
        this.enable(true);  //REENABLE
    }
    /*
    switch(this.m.mode){
        case DXL_OFF:
        case DXL_WHEEL:
            this.speed(0);
            break;
        case DXL_JOINT:
        this._curAngle = a;
            this.wantedAngle = this._curAngle;
            this.dxlGoal = this._currPos; 
            break;    
    }
    misGUI.speed(this.index,0);
    misGUI.angle(this.index,this.wantedAngle);
    */
}

Dxl.prototype.freezeMotor = function(){
    //console.log("freeeeeeeeeze:",this.index);
    if(this.enabled){
        this.freeze = true;
        this.enable(false);
    }
}

Dxl.prototype.unfreezeMotor = function(){
    if(this.freeze){
        this.freeze = false;
        this.enable(true);
    }
}

Dxl.prototype.angleRange = function(min,max){
    this.m.angleMin = min;
    this.m.angleMax = max;
    return this;
};

Dxl.prototype.joint = function(){
    this.m.mode = DXL_JOINT;
    this.m.jointSpeed = this.m.speedMax; //OK: good solution
    this.speed(this.m.jointSpeed);
    misGUI.motorAngle(this.index,this.wantedAngle); //updated by currPos
    console.log("----- Dxl.joint: ----",this.index,this.m.mode,this._curAngle);
    if(this.m.dxlID>0){
        if(this.m.model==-1){ //ask for model
            console.log("-----------askForModel");
            cm9Com.pushMessage("dxlModel "+this.m.dxlID+"\n");
        }
        if(this.m.model==12){
            cm9Com.pushMessage(
                "dxlWrite "+this.m.dxlID+","+ADDR_SLOPE_CW+",128\n"
                +"dxlWrite "+this.m.dxlID+","+ADDR_SLOPE_CCW+",128\n"); //smooth
        }
    }
    return this;
};

Dxl.prototype.wheel = function(){
    this.m.mode = DXL_WHEEL;
    this.dxlSpeed = 0;
    this.wantedSpeed = 0;
    console.log("----- Dxl.wheel: ----",this.index,this.m.mode);
    return this;
};

Dxl.prototype.angleToNorm = function(a){ //[0 1]
    return (a-this.m.angleMin)/(this.m.angleMax-this.m.angleMin);
}

//setCurrpos , returns angle
Dxl.prototype.currPos = function(p){
    if(p>=0) {
        var a = this.pos2angle(p);
        this._curAngle = a;
        this._currPos = p;

        if( this.m.mode==DXL_WHEEL ){ //||((this.m.mode==DLX_OFF) )
            this.wantedAngle = a;
            this.dxlGoal = p;
        }
        else if(!this.enabled){
            this.wantedAngle = a; 
            this.dxlGoal = p;
            misGUI.motorAngle(this.index,a);
        }
        return a;
    }
    return this.wantedAngle;
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
        if (a > this.m.angleMax)a = this.m.angleMax;
        else if (a < this.m.angleMin)a = this.m.angleMin;
        this.wantedAngle  = a;
        this.dxlGoal = this.angle2pos(a);
        return a;
    }
    else {
        return this.wantedAngle;
    }
};

Dxl.prototype.nAngle = function(an) {
    //console.log("nangle:",a," min:",this.m.angleMin," max:",this.m.angleMax);
    if(an>1)an=1.0;
    else if(an<-1)an=-1.0;
    return this.angle( this.m.angleMin + an * (this.m.angleMax - this.m.angleMin) );
};

Dxl.prototype.speed = function(s){
    if(s!=undefined) {
        if (s > this.m.speedMax)s = this.m.speedMax;
        else if (s < this.m.speedMin)s = this.m.speedMin;
        this.wantedSpeed = s; 

        var v = (s*1023/100)|0;
        if(this.m.clockwise) v=-v;
        //if(v<0) v = 1024-v; //!!! SUR LE CM9 !!!
        this.dxlSpeed = v;    
        return s;
    }
    else{
        console.log("***** Dxl.spped READ? ******");
        return this.wantedSpeed;
    }
};

Dxl.prototype.nSpeed = function(s) {
    if(s>1)s=1.0;
    else if(s<-1)s=-1.0;
    return this.speed(this.m.speedMin + s * (this.m.speedMax - this.m.speedMin) );
};

Dxl.prototype.clockwise = function(val){
    this.m.clockwise = val; //0:CW 1:CCW
    console.log("Dxl.clockwise:",this.m.clockwise);
    return this;
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

