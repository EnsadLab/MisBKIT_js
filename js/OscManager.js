/**
* Created by Cecile on 05/08/17.
*/

// TODO: use the variable from UdpSocket.js or not?
//const udp  = require('dgram'); //Didier -> index.js
//const osc = require('osc-min'); //Didier -> index.js

OscManager = function () {

    this.oscUserReceiver = null; // reads values from user on port 4444
    this.oscCm9Receiver = null; // reads commands from CM9 on port ? 5555
    
    this.outportUser = 6666; // forward sensor values to user
    this.udpUserSender = udp.createSocket("udp4");

    this.outportCm9 = 7777; //TODO: à parler avec Didier....

};


OscManager.prototype.init = function(){

    this.initUserReceiver();
    this.initCm9Receiver();

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

// handles animation messages coming from user app
OscManager.prototype.handleAnimMessage = function(rcv){

    console.log("handling animation message");
    var adr = rcv.address;
    var arg = rcv.args[0].value;

    if(adr == "/mbk/anims/start"){
        var animIDs = dxlManager.getAnimID(arg);
        for(var i=0; i<animIDs.length; i++){ // in case multiple anims with same name
            console.log("anim ids.. starting play " + animIDs[i]);
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
            var divAnim = misGUI.divAnim(animIDs[i]);
            // TODO: doesn't work.. why??? no button val()?
            var bt = divAnim.find(".loop");
            var test = bt.val();
            if(adr == "/mbk/anims/loopOn"){
                console.log("should loop on -> TEST:   " + test + " on id " + animIDs[i]);
                dxlManager.loopAnim(animIDs[i],true);
                //misGUI.animLoopOnOff(animIDs[i],true);
                //if(!divAnim.find(".loop").val()) divAnim.find(".loop").click();
            } else if(adr == "/mbk/anims/loopOff"){
                console.log("should loop off -> TEST:   " + test + " on id " + animIDs[i]);
                dxlManager.loopAnim(animIDs[i],false);
                //misGUI.animLoopOnOff(animIDs[i],false);
                //if(divAnim.find(".loop").val()) divAnim.find(".loop").click();
            }
            divAnim.find(".loop").click();
        }
    }

}

// handles motor messages coming from user app
OscManager.prototype.handleMotorMessage = function(rcv){

    var adr = rcv.address;
    var arg = rcv.args[0].value;

    console.log("handling motor message");
    // TODO: ... est-ce qu'on veut vraiment implémenter ça...? A-t-on le temps?
    // /mbk/motors/velocity/50 & etc....
    // pour pouvoir contrôler les moteurs depuis processing par exemple.

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
            oscManager.handleSensorMessage(rcv); //le self. ne marchait pas!!!
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


// TODO: Simulation pour l'instant...
// on aura par la suite une méthode onCm9Sensors appelée depuis cm9Com
OscManager.prototype.handleSensorMessage = function(rcv){

    var adr = rcv.address;
    var sensorPin = rcv.args[0].value;
    var sensorVal = rcv.args[1].value;

    console.log("handling sensor message");
    
    // updates the gui according to the values received from OSC
    sensorManager.setSensorValue(sensorPin,sensorVal);

    // forwards the message to the user applications
    // /mbk/sensors sensorName sensorValue sensorMin sensorMax
    var sensor = sensorManager.getSensorWithPin(sensorPin);
    buf = osc.toBuffer({
        address: "/mbk/sensors",
        args: [sensor.s.name,sensorVal,sensor.s.valMin,sensor.s.valMax] 
    });
    
    this.udpUserSender.send(buf, 0, buf.length, this.outportUser, "localhost");

}
