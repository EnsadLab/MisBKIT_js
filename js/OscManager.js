/**
* Created by Cecile on 05/08/17.
*/

// TODO: use the variable from UdpSocket.js or not?
const udp  = require('dgram');
const osc = require('osc-min'); 

OscManager = function () {

    this.oscUserReceiver = null; // reads values from user
    this.oscCm9Receiver = null; // reads commands from CM9
    this.outportUser = 6666; // forward sensor values to user
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
        console.log("osc msg:",rcv.address,rcv.args[0].value);
        var adr = rcv.address;
        if(adr.startsWith("/mbk/anims")){
            oscManager.handleAnimMessage(rcv); //le self. ne marchait pas!!!
        }else if(rcv.address.startsWith("/mbk/motors")){
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
        //TODO: est-ce qu'on envoie l'index de l'anim ou le nom ds les arguments OSC
        var divAnim = misGUI.divAnim(arg);
        divAnim.find(".play").click();
    }else if(adr == "/mbk/anims/stop"){

    }else if(adr == "/mbk/anims/loop"){

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
        console.log("osc msg:",rcv.address,rcv.args[0].value);
        var adr = rcv.address;
        if(adr.startsWith("/mbk/sensors")){
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


//TODO: Didier... Tu reçois deja des sensor messages j'imagine.. ceux de robus
// qui reçoit les autres messages des capteurs? ICI??
OscManager.prototype.handleSensorMessage = function(){

    var adr = rcv.address;
    var arg = rcv.args[0].value;

    console.log("handling sensor message");
    // updates the gui according to the values received from OSC
    // ....

    // forwards the message to the user applications
    var outport = 6666;
    buf = osc.toBuffer({
    address: "/mbk/sensors",
    args: [ // not sure yet how datas are added to the message... to check
        12, "sttttring", new Buffer("beat"), {
        type: "integer",
        value: 7
        }
        ]
    });
    udp.send(buf, 0, buf.length, this.outportUserSender, "localhost");

}

