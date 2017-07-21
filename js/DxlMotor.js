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

//TODO copy ?
function Dxl(index){
    this.m = { //settings
        id:0,
        enabled: false,
        model:12, //AX12 par defaut
        clockwise:true,
        mode:1, //0:joint 1:wheel //default=wheel
        angleMin: -150,
        angleMax: 150,
        speedMin: -100,
        speedMax: 100,
        torqueMax: 1023
    };

    this.index   = index;
    this.enabled = false;
    this.rec = false;
    this.timeOfRequest = 0;
    this._goalAngle    = 0;
    this._speed   = 0;
    this._currPos = NaN;
    this._curAngle = 0;
    this.temperature = 0;
    this.wantedMode   = NaN;
    this.wantedTorque = NaN;
    this.wantedAngle  = NaN;
    this.wantedSpeed  = NaN;
    this._taskCount = 0;
    this._regRead = -1;
    this.limitCW  = 0;
    this.limitCCW = 1023; //AX12
    this.angleRef  = 300; //AX12
}

Dxl.prototype.getGoal= function(){
    if(!isNaN(this.wantedAngle)){
        var a = this.m.clockwise ? -this.wantedAngle : this.wantedAngle;
        this.wantedAngle = NaN;
        return this.angle2pos(a);
    }
    else
        return -1;
}

Dxl.prototype.getSpeed= function(){
    var v = -1;
    if(!isNaN(this.wantedSpeed)){
        v = this.m.clockwise ? -this.wantedSpeed : this.wantedSpeed;
        this.wantedSpeed = NaN;
        if(v<0)
            v = 1024-v;
        //console.log("dxl.getSpeed:",v);
    }
    return v|0;
}

Dxl.prototype.pos2angle=function(p){
    return ((p/this.limitCCW)-0.5)*this.angleRef;
}

Dxl.prototype.angle2pos=function(a){
    //default: AX12
    if(this.m.model!=12)
        return (2048 +(a * 2048 / 180))|0; //MX28 ...
    else
        return (512 +(a * 511.5 / 150))|0; //AX12
}



Dxl.prototype.onAddr=function(addr,val){
    switch(addr){
        case ADDR_MODEL:
            this.model(val);
            break;
        case ADDR_POSITION:
            var a = this.pos2angle(val);
            if (this.m.clockwise) a = -a;
            this._curAngle = a;
            this._currPos  = val;
            break;
        default:
            console.log("DXLREG? ",reg," ",val);
    }
}

Dxl.prototype.pushSerialMsg = function(stack){
    if(!this.enabled)
        return;

    if(!isNaN(this.wantedMode)){
        if(this.wantedMode==0){ //joint
            this.wantedAngle = NaN;
            misGUI.angle(this.index,this._curAngle);
            //if(!isNaN(this._currPos))
            /*
            stack.push("EW "+this.index+","+ADDR_TORQUE_ENABLE+",1,\n");
            stack.push("EW "+this.index+","+ADDR_SPEED+",1,\n");
            stack.push("EW "+this.index+","+ADDR_TORQUE+",0,\n");
            if(this._currPos>0)
                stack.push("EW "+this.index+","+ADDR_GOAL+","+this._currPos+",\n");

            //TOTHINK : dxl limits ?
            stack.push("EW "+this.index+","+ADDR_CW_LIMIT+",0,\n");
            stack.push("EW "+this.index+","+ADDR_CCW_LIMIT+","+this.limitCCW+",\n"); //AX_12
            if(this._currPos>=0)
                stack.push("EW "+this.index+","+ADDR_GOAL+","+this._currPos+",\n");
            //this.wantedAngle = this._curAngle;
            this.wantedTorque = this.m.torqueMax;
            //if(this.m.clockwise) this.wantedSpeed = -this.m.speedMax;
            //else this.wantedSpeed = this.m.speedMax;//see update
            this.m.mode = 0;
            //console.log("curAngle:",this._curAngle);
            //console.log("JOINT: ",this.wantedSpeed," ",this.m.speedMax);
            */
            dxlManager.cm9Msg("joint "+this.index+"\n");
            this.wantedTorque = this.m.torqueMax;
            this.wantedSpeed = 0;
            this.m.mode = 0;

        }
        else{ //wheel
            //stack.push("EW "+this.index+" "+ADDR_TORQUE+" 0\n");
            /*
            stack.push("EW "+this.index+","+ADDR_SPEED+",0,\n");
            stack.push("EW "+this.index+","+ADDR_CCW_LIMIT+",0,\n");
            stack.push("EW "+this.index+","+ADDR_CW_LIMIT+",0,\n");
            */
            dxlManager.cm9Msg("wheel "+this.index+"\n");
            //stack.push("EW "+this.index+" "+ADDR_SPEED+",0,\n");
            this.wantedSpeed = 0;
            this.wantedTorque = this.m.torqueMax;
            this.m.mode = 1;
            //console.log("curAngle:",this._curAngle);
        }
        this.wantedMode = NaN;
        return; //... next'frame'
    }
/*
    if(!isNaN(this.wantedSpeed)){
        var s = this.m.clockwise ? -this.wantedSpeed : this.wantedSpeed;
        dxlManager.cm9Msg("EW "+this.index+","+ADDR_SPEED+","+s+",\n");
        this.wantedSpeed = NaN;
    }
*/
/*
    if(!isNaN(this.wantedAngle)){
        var a = this.m.clockwise ? -this.wantedAngle : this.wantedAngle;
        var g = this.angle2pos(a);
        dxlManager.cm9Msg("EW "+this.index+" "+ADDR_GOAL+" "+g+"\n");
        this.wantedAngle = NaN;
    }
*/
    if(!isNaN(this.wantedTorque)){
        stack.push("EW "+this.index+","+ADDR_TORQUE+","+this.wantedTorque+",\n");
        this.wantedTorque = NaN;
        return; //... next'frame'
    }

}

Dxl.prototype.copySettings = function(s){
    for(var e in s){
        this.m[e]=s[e];
    }
    //console.log("copySettings:clockwise",this.index," ",this.m.clockwise);
}

Dxl.prototype.getSettings=function(){
    //console.log("getSettings:clockwise:",this.index," ",this.m.clockwise);
    return this.m;
}

Dxl.prototype.update = function(t){
    /*
     if( (this.timeOfRequest>0)&&((t-this.timeOfRequest)>1000)){
     this.enabled = false;
     this.timeOfRequest = 0;
     dxlManager.dxlEnabled(this.index,0);
     console.log("RQ timeout");
     return false;
     }
     */
    if(this.m.id>0) {
        if (this._regRead >= 0) {
            this._taskCount++;
            if((this._taskCount & 7)==0) {
                dxlManager.cm9Msg("DR " + this.m.id + "," + this._regRead + ",\n");
                if (++this._regRead >= 48)
                    this._regRead = -1;
            }
        }
    }


    return true;
}

Dxl.prototype.cm9Init = function() {
    if(this.m.id<1)
        return;

    dxlManager.cm9Msg("EI " + this.index + "," + this.m.id + ",\n");
    dxlManager.cm9Msg("model " + this.index + ",\n");
    if(this.enabled)
        this.enable(true);
}

Dxl.prototype.model=function(val){
    console.log("model[",this.index,"]",val);
    switch(val){
        case -1:
            //no answer ... disable , ask again ?
            break;
        case 12: //AX12
            this.m.model = val;
            this.limitCCW = 1023;
            this.angleRef  = 300;
            //compliance très souple par defaut
            dxlManager.cm9Msg("EW "+this.index+","+ADDR_SLOPE_CW+",128,\n");
            dxlManager.cm9Msg("EW "+this.index+","+ADDR_SLOPE_CCW+",128,\n");

            break;

        //case -1: //!!!MX28 par defaut, becoz RS485
        case 29: //MX28
        default: //MX64 MX106 ..
            this.m.model = val;
            this.limitCCW = 4095;
            this.angleRef  = 380;
            break;
    }
    this.mode(this.m.mode);
}

Dxl.prototype.dxlID = function(id){
    if(this.m.id>=0)
        this.enable(false);

    this.m.id = +id;
    this.enabled = false;
    dxlManager.cm9Msg("EI " + this.index + "," + id + ",\n");
    if(this.m.id>0){
        dxlManager.cm9Msg("EM " + this.index + ",\n"); //request model
    }
    return this;
};

Dxl.prototype.enable = function(onoff){
    if(this.m.id<1){  //no id : cannot enable (ping?)
        this.enabled = false;
        dxlManager.dxlEnabled(this.index,0);
        return false;
    }

    if(onoff){
        dxlManager.cm9Msg("EI "+this.index+","+this.m.id+",\n");
        //dxlManager.cm9Msg("model "+this.index+",\n"); //request model again
        this._speed = 0;
        this.wantedSpeed = 0;
        this.enabled = true;
        this.wantedMode = this.m.mode;
        misGUI.speed(this.index,0);
    }
    else{ //mode wheel pour "relax" AX12 //A REVOIR!!!
        this.enabled = false;
        dxlManager.cm9Msg("EW "+this.index+","+ADDR_TORQUE+",0,\n");
        dxlManager.cm9Msg("EW "+this.index+","+ADDR_SPEED+",0,\n");
        dxlManager.cm9Msg("EW "+this.index+","+ADDR_CW_LIMIT+",0,\n");
        dxlManager.cm9Msg("EW "+this.index+","+ADDR_CCW_LIMIT+",0,\n");
        this._speed = 0;
        misGUI.speed(this.index,0);
    }
    return onoff;
}


Dxl.prototype.mode=function(mod){
    if(mod!=undefined){
        this.wantedMode = mod;
        this.m.mode = mod;
        console.log("SETMODE:",this.wantedMode);
    }
    return this.m.mode;
}

Dxl.prototype.angleRange = function(min,max){
    this.m.angleMin = min;
    this.m.angleMax = max;
    return this;
};

Dxl.prototype.joint = function(){
    this.mode(0);
    return this;
};

Dxl.prototype.wheel = function(){
    this.mode(1);
    return this;
};

Dxl.prototype.currPos=function(p){
    if(p>=0) {
        var a = this.pos2angle(p);


        if (this.m.clockwise) a = -a;
        this._curAngle = a;
        this._currPos = p;
        return a;
    }
    return 0;
}

Dxl.prototype.angle = function(a){
    if(a!=undefined) {
        if (a > this.m.angleMax)a = this.m.angleMax;
        else if (a < this.m.angleMin)a = this.m.angleMin;
        //this._goal = this.angle2pos(a);
        this._goalAngle  = a;
        this.wantedAngle = a;
        return a;
    }
    else {
        //return (this._goal - 512) * (150 / 512);   //
        //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        return 0;
    }
};


Dxl.prototype.nAngle = function(an) {
    //console.log("nangle:",a," min:",this.m.angleMin," max:",this.m.angleMax);
    var a = this.m.angleMin + an * (this.m.angleMax - this.m.angleMin);
    this.angle( a );
    return a;
};

Dxl.prototype.velocity = function(v){
    //console.log("VELOCITY:",v);
    if(v!=undefined)
        return this.speed(v); // (v*1023)/100);
}

Dxl.prototype.speed = function(s){
    if(s!=undefined) {
        if (s > this.m.speedMax)s = this.m.speedMax;
        else if (s < this.m.speedMin)s = this.m.speedMin;
        //if(this.m.clockwise)s=-s;
        this._speed = s;
        this.wantedSpeed = (s*1023/100)|0;
        //console.log("WANTED SPEED:",s,this.wantedSpeed);
        return s;
    }
    else
        return this._speed;
};

Dxl.prototype.nSpeed = function(s) {
    //console.log("nspeed:",this.m.speedMin,' ',this.m.speedMax);
    return this.speed(this.m.speedMin + s * (this.m.speedMax - this.m.speedMin) );
};

Dxl.prototype.clockwise = function(val){
    this.m.clockwise = (val==0); //0:CW 1:CCW
    return this;
}

Dxl.prototype.angleMin = function(val){
    this.m.angleMin = val;
    return this;
};

Dxl.prototype.angleMax = function(val){
    this.m.angleMax = val;
    return this;
};

Dxl.prototype.speedMin = function(val){
    console.log("DXL-speedMin",val);
    this.m.speedMin = val;
    return this;
};

Dxl.prototype.speedMax = function(val){
    console.log("SPEEDMAX:",val);
    this.m.speedMax = val;
    return this;
};

Dxl.prototype.copy = function(from){
    //this.m.enabled = from.m.enabled;
    //this.m.model  = from.m.
    this.m.clockwise  = from.m.clockwise;
    this.m.mode = from.m.mode;
    this.m.angleMin = from.m.angleMin;
    this.m.angleMax = from.m.angleMax;
    this.m.speedMin = from.m.speedMin;
    this.m.speedMax = from.m.speedMax;
    this.m.torqueMax = from.m.torqueMax;

    this.wantedMode = this.m.mode;
}