/**
* Created by Cecile on 05/08/17.
*/

/**
 * note(Didier)
 * sensorSimulator            oscP5 8888 , remote 5555
 * animationTrigger           oscP5 6666 , remote 4444
 * motorTrigger               oscP5 6666,  remote 4444
 * multipleAnimationTrigger : oscP5 6666 , remote 4444
 */


OscManager = function () {
    this.s = { //settings
        //oscLocalIP: "localhost",
        oscRemoteIP: "localhost",
        oscLocalPort: 4444,
        oscRemotePort: 6666        
    };

    this.oscUserReceiver = null; // reads values from user on port 4444
    this.oscCm9Receiver = null; // reads commands from CM9 on port ? 5555
    
    this.outportUser = 6666; // forward sensor values to user
    this.udpUserSender = udp.createSocket("udp4");

    this.outportCm9 = 7777; //TODO: à parler avec Didier....

};


OscManager.prototype.init = function(){

    this.initUserReceiver();
    this.initCm9Receiver();

    misGUI.showOSC(this.s);

}

OscManager.prototype.initUserReceiver = function(){
    
    var inport = 4444;
    this.oscUserReceiver = udp.createSocket("udp4", function(msg, rinfo) {
    var error, error1;
    try {
        var rcv = osc.fromBuffer(msg);
        var adr = rcv.address;
        if(adr.startsWith("/mbk/anims")){
            console.log("osc msg:",rcv.address,rcv.args[0].value);
            oscManager.handleAnimMessage(rcv); //le self. ne marchait pas!!!
        }else if(rcv.address.startsWith("/mbk/motors")){
            console.log("osc msg:",rcv.address);
            oscManager.handleMotorMessage(rcv);
        }else{
            console.log("invalid OSC message: " + rcv);
        }
        return rcv;
        } catch (error1) {
            error = error1;
            return console.log("invalid OSC packet " + error);
        }
    });
    
    this.oscUserReceiver.bind(inport);

}

//... mobilizing ... in progress
//TODO split
OscManager.prototype.handleMessage = function(rcv){
    var adr = rcv.address;
    if(adr.startsWith("/mbk/anims")){
        //console.log("mbz msg:",rcv.address,rcv.args[0].value);
        oscManager.handleAnimMessage(rcv);
    }else if(rcv.address.startsWith("/mbk/motors")){
        //console.log("mbz msg:",rcv.address);
        oscManager.handleMotorMessage2(rcv);
    }else{
        console.log("invalid OSC message: " + rcv);
    }
}

//OscManager.prototype.handleMessage2 = function(split,args){
    
//}    

// mobilizing ... in progress
OscManager.prototype.handleMotorMessage2 = function(rcv){
    var adds = rcv.address.split("/");
    // ,,mbk,motors,cmd,index ....
    var vals  = oscManager.getValsInAdress(4,adds,rcv.args);
    //vals[0]=indexMotor 
    console.log("osc motors:",adds[3],vals);
    /* 
    if( typeof dxlManager[adds[3]]==='function' ){
        //console.log("DXLMANAGER has ",dxlManager[adds[3]]);
        dxlManager[adds[3]](args);
    }
    ok ça marche ... on verra plus tard */

    switch(adds[3]){ //cmd
        case "posN":
            dxlManager.setAngleN(vals[0],vals[1]);
            break;
        case "speedN":
            dxlManager.setSpeedN(vals[0],vals[1]);
            break;
        case "pos":
        case "angle":
        case "joint":
            dxlManager.setAngle(vals[0],vals[1]);
            break;
        case "speed":
        case "wheel":
            var a = dxlManager.setSpeed(vals[0],vals[1]);
            break;
        case "wheelmode":
            this.setMode(vals[0],0);
            break;    
        case "jointmode":
            this.setMode(vals[0],1);
            break;
        case "stop":
            dxlManager.stopMotor(vals[0]);
            break;
        case "stopAll": //stops motors and anims
            dxlManager.stopAll(); //TODO: gui....?
            break;
           
        default:
            console.log("unknown osc msg");        

    }
}

//transferre les derniers item de address dans vals
OscManager.prototype.getValsInAdress = function(index,splt,args){
    vals = [];
    for(var i=index;i<splt.length;i++){
        if(isNaN(splt[i]))
            vals.push(splt[i]);
        else
            vals.push(+splt[i]);
    }
    for(var i=0;i<args.length;i++){
        vals.push(args[i].value);
    }
    return vals;
}


// handles animation messages coming from user app
OscManager.prototype.handleAnimMessage = function(rcv){

    var adr = rcv.address;
    var arg = rcv.args[0].value;
    console.log("handling animation message",arg);
    
    if(adr == "/mbk/anims/start"){
        var animIDs = dxlManager.getAnimID(arg);
        for(var i=0; i<animIDs.length; i++){ // in case multiple anims with same name
            var divAnim = misGUI.divAnim(animIDs[i]);
            divAnim.find(".play").click();
        }
    }else if(adr == "/mbk/anims/stop"){
        var animIDs = dxlManager.getAnimID(arg);
        for(var i=0; i<animIDs.length; i++){ // in case multiple anims with same name
            var divAnim = misGUI.divAnim(animIDs[i]);
            divAnim.find(".stop").click();
        }
    }else if(adr.startsWith("/mbk/anims/loop")){
        var animIDs = dxlManager.getAnimID(arg);
        for(var i=0; i<animIDs.length; i++){ // in case multiple anims with same name
            if(adr == "/mbk/anims/loopOn"){
                dxlManager.loopAnim(animIDs[i],true);
            } else if(adr == "/mbk/anims/loopOff"){
                dxlManager.loopAnim(animIDs[i],false);
            }
        }
    }

}

// handles motor messages coming from user app
OscManager.prototype.handleMotorMessage = function(rcv){

    var adr = rcv.address;
    var arg;
    if(!adr.startsWith("/mbk/motors/stopAll")){
        arg = rcv.args[0].value;
        //arg = rcv.args[0];
        //console.log("arg",arg);
    }
    
    //console.log("arg: " + arg);
    console.log("handling motor message ",adr,arg);

    var motorIndex;
    if(adr.startsWith(cmp = "/mbk/motors/wheelmode")){
        this.setMode(arg,0);    
    }else if(adr.startsWith(cmp = "/mbk/motors/jointmode")){
        this.setMode(arg,1);
    }else if(adr.startsWith(cmp = "/mbk/motors/wheel/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        console.log("motorIndex:",motorIndex,arg);
        //this.setMode(motorIndex,0);
        misGUI.speed(+motorIndex,arg);
    }else if(adr.startsWith(cmp = "/mbk/motors/speed/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        var s = dxlManager.setAngle(+motorIndex,arg);
        console.log("motorIndex:",motorIndex,arg);
        //this.setMode(motorIndex,0);
        misGUI.speed(+motorIndex,arg);
    }else if(adr.startsWith(cmp = "/mbk/motors/joint/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        //this.setMode(motorIndex,1);
        var a = dxlManager.setAngle(+motorIndex,arg);
        misGUI.angle(motorIndex,a);
    }else if(adr.startsWith(cmp = "/mbk/motors/goal/")){
        console.log("GOAL");
        motorIndex = this.getArgInAdress(adr,cmp);
        var a = dxlManager.setAngle(+motorIndex,arg);
        misGUI.angle(motorIndex,a);
    }else if(adr.startsWith(cmp = "/mbk/motors/wheeljoint/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        var divMotor = misGUI.getMotorUI(motorIndex);
        //misGUI.setValue(motorIndex,"joint",arg);
        if(divMotor.find("[name=mode]").prop('checked')) misGUI.speed(motorIndex,arg);
        else misGUI.angle(motorIndex,arg);
    }else if(adr.startsWith(cmp = "/mbk/motors/stopAll")){ // stops motors and anims
        //dxlManager.stopAll(); //TODO: gui....?
        dxlManager.stopAllMotors();
    }else if(adr.startsWith(cmp = "/mbk/motors/stop")){ // only stops motor
        dxlManager.stopMotor(arg);
        /*
        var divMotor = misGUI.getMotorUI(arg);
        if(divMotor.find("[name=mode]").prop('checked')) misGUI.speed(arg,0);
        else misGUI.angle(arg,0);
        */
    }

}


OscManager.prototype.setMode = function(motorIndex, mode){
    var divMotor = misGUI.getMotorUI(motorIndex);
    if((mode == 0 && !divMotor.find("[name=mode]").prop('checked')) ||
        (mode == 1 && divMotor.find("[name=mode]").prop('checked')) )
            divMotor.find("[name=mode]").click();
}


OscManager.prototype.getArgInAdress = function(adrSrc,adrCmp){
    return parseInt(adrSrc.substring(adrCmp.length));
}

OscManager.prototype.initCm9Receiver = function(){
    
    var inport = 5555;
    this.oscCm9Receiver = udp.createSocket("udp4", function(msg, rinfo) {
    var error, error1;
    try {
        var rcv = osc.fromBuffer(msg);
        var adr = rcv.address;
        if(adr.startsWith("/mbk/sensors")){
            console.log("osc msg:",rcv.address,rcv.args[0].value,rcv.args[1].value);
            //////////
            //now we have different inputs that can change sensor value, so better to
            //send the osc sensor values directly from the onValue method..
            //new:
            var sensorPin = rcv.args[0].value;
            var sensorVal = rcv.args[1].value;
            var sensor = sensorManager.getSensorWithPin(sensorPin);
            sensor.onValue(sensorVal);
            //old:
            //oscManager.handleSensorMessage(rcv); //le self. ne marchait pas!!!
            //////////
        }else{
            console.log("invalid OSC message: " + rcv);
        }
        return rcv;
        } catch (error1) {
            error = error1;
            return console.log("invalid OSC packet " + error);
        }
    });
    
    this.oscCm9Receiver.bind(inport);

}

OscManager.prototype.sendSensorMessage = function(sensorID,sensorVal){

    var sensor = sensorManager.sensors[sensorID];

    // /mbk/sensors sensorName sensorValue sensorMin sensorMax   
    buf = osc.toBuffer({
        address: "/mbk/sensors",
        args: [sensor.s.name,sensorVal,sensor.s.valMin,sensor.s.valMax] 
    });
    
    this.udpUserSender.send(buf, 0, buf.length, this.outportUser, "localhost");

    // concat messages into the adress for programs that handle osc messages only with one parameter
    buf = osc.toBuffer({
        address: "/mbk/sensors/" + sensorVal + "/" + sensor.s.valMin + "/" + sensor.s.valMax,
        args: [sensor.s.name]
    });
 
    this.udpUserSender.send(buf, 0, buf.length, this.outportUser, "localhost");
}


// TODO: Simulation pour l'instant...
// enlever?
OscManager.prototype.handleSensorMessage = function(rcv){

    var adr = rcv.address;
    var sensorPin = rcv.args[0].value;
    var sensorVal = rcv.args[1].value;

    console.log("handling sensor message");
    
    // updates the gui according to the values received from OSC
    var sensor = sensorManager.getSensorWithPin(sensorPin);
    sensor.onValue(sensorVal);
    

    // forwards the message to the user applications
    // /mbk/sensors sensorName sensorValue sensorMin sensorMax   
    buf = osc.toBuffer({
        address: "/mbk/sensors",
        args: [sensor.s.name,sensorVal,sensor.s.valMin,sensor.s.valMax] 
    });
    
    this.udpUserSender.send(buf, 0, buf.length, this.outportUser, "localhost");

    // concat messages into the adress for programs that handle osc messages only with one parameter
    buf = osc.toBuffer({
        address: "/mbk/sensors/" + sensorVal + "/" + sensor.s.valMin + "/" + sensor.s.valMax,
        args: [sensor.s.name]
    });

    this.udpUserSender.send(buf, 0, buf.length, this.outportUser, "localhost");

}
