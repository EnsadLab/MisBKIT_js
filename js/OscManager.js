/**
* Created by Cecile on 05/08/17.
*/

/**
 * note(Didier)
 * sensorSimulator            oscP5 8888 , remote 4444
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
    
    //this.outportUser = 6666; // forward sensor values to user
    this.udpUserSender = udp.createSocket("udp4");

    this.outportCm9 = 7777; //TODO: à parler avec Didier....

};

OscManager.prototype.setSettings = function(set){
    console.log("osc.setSettings",set);
    this.close();
    for (var p in set) {
        console.log("osc."+p+" "+set[p]);
        this.s[p]=set[p];
    }
    misGUI.showOSC(this.s);
}

OscManager.prototype.changeParam = function(name,value){
    this.close();
    if(this.s[name]){
        this.s[name]=value;
    }
    else
        console.log("osc bad param:",name,val);

}

OscManager.prototype.onOff = function(onoff){
    if(onoff) this.open();
    else this.close();
}

OscManager.prototype.open = function(){
    console.log("OscManager.open:");

    this.initUserReceiver();
    //this.initCm9Receiver();
}

OscManager.prototype.close= function(){
    if(this.oscUserReceiver){
        this.oscUserReceiver.close();
        this.oscUserReceiver = undefined;
    }
    if(this.oscCm9Receiver){
        this.oscCm9Receiver.close()
        this.oscCm9Receiver = undefined;
    }
    misGUI.enableOSC(false);
}

OscManager.prototype.initUserReceiver = function(){
    console.log("OSC:initUserReceiver",this.s.oscLocalPort);
    //var inport = 4444;
    var inport = this.s.oscLocalPort; //4444;
    this.oscUserReceiver = udp.createSocket("udp4", function(msg, rinfo) {
        var error, error1;
        //console.log("osc rcv");
        try {
            var rcv = osc.fromBuffer(msg);
            var adr = rcv.address;
            if(adr.startsWith("/mbk/anims")){
                console.log("osc msg:",rcv.address,rcv.args[0].value);
                oscManager.handleAnimMessage(rcv); //le self. ne marchait pas!!!
            }else if(rcv.address.startsWith("/mbk/motors")){
                console.log("osc msg:",rcv.address);
                oscManager.handleMotorMessage(rcv);
            }else if(rcv.address.startsWith("/mbk/sensors")){
                console.log("osc msg:",rcv.address);
                oscManager.handleSensorMessage(rcv);
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
    console.log(this.oscUserReceiver);

}

//... mobilizing ... in progress
//TODO split
OscManager.prototype.handleMessage = function(rcv,mobz_connexion){
    var adr = rcv.address;
    if(adr.startsWith("/mbk/anims")){
        //console.log("mbz msg:",rcv.address,rcv.args[0].value);
        oscManager.handleAnimMessage(rcv);
    }else if(rcv.address.startsWith("/mbk/motors")){
        console.log("OSC.handleMessage:",rcv.address);
        oscManager.handleMotorMessage2(rcv);
    }else if(rcv.address.startsWith("/mbk/sensors")){
        oscManager.handleSensorMessage(rcv,mobz_connexion);
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
        console.log("whheel:",motorIndex,arg);
        //this.setMode(motorIndex,0);
        misGUI.motorSpeed(+motorIndex,arg);
    }else if(adr.startsWith(cmp = "/mbk/motors/speed/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        console.log("speed:",motorIndex,arg);
        var s = dxlManager.setAngle(+motorIndex,arg);
        console.log("motorIndex:",motorIndex,arg);
        //this.setMode(motorIndex,0);
        dxlManager.setSpeed(+motorIndex,arg)
        misGUI.motorSpeed(+motorIndex,arg);
    }else if(adr.startsWith(cmp = "/mbk/motors/joint/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        //this.setMode(motorIndex,1);
        var a = dxlManager.setAngle(+motorIndex,arg);
        misGUI.motorAngle(motorIndex,a);
    }else if(adr.startsWith(cmp = "/mbk/motors/goal/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        var a = dxlManager.setAngle(+motorIndex,arg);
        misGUI.motorAngle(motorIndex,a);
    }else if(adr.startsWith(cmp = "/mbk/motors/wheeljoint/")){
        motorIndex = this.getArgInAdress(adr,cmp);
        var divMotor = misGUI.getMotorUI(motorIndex);
        //misGUI.setValue(motorIndex,"joint",arg);
        if(divMotor.find("[name=mode]").prop('checked')) misGUI.motorSpeed(motorIndex,arg);
        else misGUI.motorAngle(motorIndex,arg);
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
    console.log("getArgInAdress",adrSrc,adrCmp);
    return parseInt(adrSrc.substring(adrCmp.length));
}


OscManager.prototype.getStringInAdress = function(adrSrc,adrCmp){
    console.log("getArgInAdress",adrSrc,adrCmp);
    return adrSrc.substring(adrCmp.length);
}


OscManager.prototype.sendSensorMessage = function(sensorID,sensorVal){

    var sensor = sensorManager.getSensorWithID(sensorID);//sensorManager.sensors[sensorID];
    if(sensor == undefined) return;

    // /mbk/sensors sensorName sensorValue sensorMin sensorMax   
    buf = osc.toBuffer({
        address: "/mbk/sensor/"+sensor.s.name,
        args: [sensorVal] //,sensor.s.valMin,sensor.s.valMax] 
    });
    
   // console.log("remote port",this.s.oscRemotePort);

    //this.udpUserSender.send(buf, 0, buf.length, this.outportUser, "localhost");
    this.udpUserSender.send(buf, 0, buf.length, this.s.oscRemotePort, this.s.oscRemoteIP);
    
    // concat messages into the adress for programs that handle osc messages only with one parameter
    buf = osc.toBuffer({
        address: "/mbk/sensors/" + sensorVal + "/" + sensor.s.valMin + "/" + sensor.s.valMax,
        args: [sensor.s.name]
    });
 
    this.udpUserSender.send(buf, 0, buf.length, this.s.oscRemotePort, this.s.oscRemoteIP );
}



OscManager.prototype.handleSensorMessage = function(rcv,mobz_connexion){

    var adr = rcv.address;
    var nb_args = rcv.args.length;

    var mobilizing = true;
    if(mobz_connexion == undefined) mobilizing = false;

    //console.log("handling sensor message:",adr + " with " + nb_args + " args");
    if(adr == "/mbk/sensors"){ //mbk/sensors/ sensor_name value minValue maxValue OR /mbk/sensors/ sensor_name value
        var sensor_name = rcv.args[0].value;
        var value = parseFloat(rcv.args[1].value);
        if(nb_args == 4){
            var minValue = parseFloat(rcv.args[2].value);
            var maxValue = parseFloat(rcv.args[3].value);
            sensorManager.onOscMessage(sensor_name,value,mobilizing,parseInt(minValue),parseInt(maxValue));
        }else{
            sensorManager.onOscMessage(sensor_name,value,mobilizing);
        }
    }else if(adr.startsWith(cmp = "/mbk/sensors/")){ //mbk/sensors/sensorName value
        var sensor_name = this.getStringInAdress(adr,cmp);
        var value = parseFloat(rcv.args[0].value);
        sensorManager.onOscMessage(sensor_name,value,mobilizing);
    }
    
}
