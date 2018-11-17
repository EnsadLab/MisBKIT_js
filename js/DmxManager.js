const SerialLib = require('serialport');

//ENTTEC DMX PRO
var	  ENTTEC_PRO_DMX_STARTCODE = 0x00
    , ENTTEC_PRO_START_OF_MSG  = 0x7e
    , ENTTEC_PRO_END_OF_MSG    = 0xe7
    , ENTTEC_PRO_SEND_DMX_RQ   = 0x06
    , ENTTEC_PRO_RECV_DMX_PKT  = 0x05
    , ENTECC_PRO_SERNUM_RQ     = 10
    ;
    // 'baudrate': 250000,
    // 'databits': 8,
    // 'stopbits': 2,
    // 'parity': 'none'

class DmxManager{
    constructor(){
        this.serialPort = undefined;
        this.autoSend   = false;
        this.modified   = false;
        this.enttecUniv = new Buffer(512+6); //+header5 + ENTTEC_PRO_END_OF_MSG à la fin
        this.enttecUniv.fill(0); //inutile ??
        this.enttecUniv[0]=ENTTEC_PRO_START_OF_MSG;
        this.enttecUniv[1]=ENTTEC_PRO_SEND_DMX_RQ;
        this.enttecUniv[2]= (512 + 1) & 0xff; //
        this.enttecUniv[3]=((512 + 1) >> 8) & 0xff;
        this.enttecUniv[4]=ENTTEC_PRO_DMX_STARTCODE;
        this.enttecUniv[517]=ENTTEC_PRO_END_OF_MSG;         
    }

    cmd(func,eltID,val,param){
        console.log("dmxManager cmd:",func,eltID,val,param);
        if(this[func]!=undefined){
            this[func](val,param);    
        }
    }

    init(){
        console.log("------DmxManager.init-------");
        misGUI.initManagerFunctions(this,"dmxManager");
        console.log("------DmxManager length:",this.enttecUniv.length);
        console.log("------>> LSB:",this.enttecUniv[2] ); //
        console.log("------>> MSB:",this.enttecUniv[3] );
    }

    update(){
        if( this.serialPort && this.autoSend && this.modified )
            this.sendFrame()
    }

    onOff( onoff ){
        if(onoff)this.open();
        else this.close();
    }

    close(){
        misGUI.showValue({class:"dmxManager",func:"onOff",val:false});
        if(this.serialPort != undefined){
            console.log("dmx closing")
            this.serialPort.close();
            this.serialPort = undefined;
        }
    }

    open(){
        this.scanSerials(this.openSerial.bind(this));
    }

    setValue(index,val){
        if(index<512)
            this.enttecUniv[index+5]=val;
    }

    setRGB(index,r,g,b){
        if(index<512){
            this.enttecUniv[index+5]=r;
            this.enttecUniv[index+6]=g;
            this.enttecUniv[index+7]=b;
        }        
    }

    sendFrame(){
        if(this.serialPort != undefined)
            this.serialPort.write(this.enttecUniv)
        this.modified = false;
    }

    openSerial( portname ){
        this.close();
        console.log("DMX:open:",portname);
        if(portname==undefined || portname=="" )
            return;
    
        console.log("DMX:opening:",portname);
        var self = this;
        this.serialPort = new SerialLib(portname,{baudRate:250000});
        console.log("DMX: port:",this.serialPort);
        this.serialPort.on('open',()=>{
            console.log("DMX:openned:",portname);
            misGUI.showValue({class:"dmxManager",func:"onOff",val:true});
            this.serialNumber();
        });
        this.serialPort.on('data',(rcv)=>{ //ENTTEC serial number
            if(rcv[0]==126){ //ENTTEC serial number
                var str ="serial n°: ";
                for(var i=0;i<rcv.length;i++){
                    var c = rcv[i];
                    str+= String.fromCharCode(48+(c & 0xF)); //serialCode
                    str+= String.fromCharCode(48+(c >> 4));
                }
                misGUI.showValue({class:"dmxManager",func:"serialNumber",val:str});
            }
            else{
                console.log("DMX rcv:",rcv[0],rcv.length);
            }
        });

        this.serialPort.on('error',(err)=>{
            console.log("DMX Serial ERROR:",err);
            misGUI.showValue({class:"dmxManager",id:this.id,func:"onOff",val:"ERROR"});
            misGUI.showValue({class:"dmxManager",func:"serialNumber",val:""});
            self.serialPort = undefined;
        });

    }//openSerial

    clear(){
        for(var i=5;i<517;i++) //512+5=517
            this.enttecUniv[i]=0;
        //this.sendFrame();  //user hands
    }

    //find ENTTEC ( last one )
    scanSerials(callback){ //cb( name_of_port )
        misGUI.showValue({class:"dmxManager",func:"serialNumber",val:""});
        var name = undefined;
        SerialLib.list(function(err, ports) {
            if (err)
                console.log("dmx.scanSerials ERROR:", err);
            else {
                for (var i = 0; i < ports.length; i++) {
                    //console.log("serials:",ports[i].comName,ports[i].manufacturer);
                    if( ports[i].manufacturer == "ENTTEC" )
                        name = ports[i].comName;
                }
                console.log("dmx serials:",name);
                misGUI.showValue({class:"dmxManager",func:"portName",val:name});
            }
            if(name==undefined){
                misGUI.showValue({class:"dmxManager",func:"portName",val:"ENTTEC not found"});
                misGUI.showValue({class:"dmxManager",func:"onOff",val:false}); //ERROR ?                
            }
            else if(callback){
                callback(name);
            }
        });            
    }

    serialNumber() {
        this.serialPort.write(
            Buffer([
                ENTTEC_PRO_START_OF_MSG,
                ENTECC_PRO_SERNUM_RQ,
                0,0,
                ENTTEC_PRO_END_OF_MSG
            ])
        );
    }
    

}
module.exports = new DmxManager()

/**
 * Created by Didier on 04/05/16.
 */
/*
"use strict"

//var FTDI = require('ftdi')


var	  ENTTEC_PRO_DMX_STARTCODE = 0x00
    , ENTTEC_PRO_START_OF_MSG  = 0x7e
    , ENTTEC_PRO_END_OF_MSG    = 0xe7
    , ENTTEC_PRO_SEND_DMX_RQ   = 0x06
    , ENTTEC_PRO_RECV_DMX_PKT  = 0x05
    , ENTECC_PRO_SERNUM_RQ     = 10
    ;

function EnttecUSBDMXPRO(serialpath, callback) {
    var self = this;
    this.cb = callback || function() {}
    this.serialPath = serialpath;
    this.serialBauds = 115200; //250000
    this.serial = new SerialClass();
    this.enttecUniv = new Buffer(512+6); //+header5 + ENTTEC_PRO_END_OF_MSG à la fin
    this.universe = new Buffer(512);
    this.universe.fill(0);

    this.serial.list();
    this.serial.boundRcv = this.receive.bind(this);

    this.enttecUniv.fill(0); //inutile ??
    this.enttecUniv[0]=ENTTEC_PRO_START_OF_MSG;
    this.enttecUniv[1]=ENTTEC_PRO_SEND_DMX_RQ;
    //( length +1 )LSB
    //( length +1 )MSB
    this.enttecUniv[4]=ENTTEC_PRO_DMX_STARTCODE;
    this.enttecUniv[517]=ENTTEC_PRO_END_OF_MSG;

}


EnttecUSBDMXPRO.prototype.send_universe = function() {
    //console.log("sendUniverse");
    if(!this.serial.isOpen()) {
        console.log("serial NOT open!");
        return;
    }

    var hdr = Buffer([
        ENTTEC_PRO_START_OF_MSG,
        ENTTEC_PRO_SEND_DMX_RQ,
        (this.universe.length + 1)       & 0xff,
        ((this.universe.length + 1) >> 8) & 0xff,
        ENTTEC_PRO_DMX_STARTCODE
    ])

    var msg = Buffer.concat([
        hdr,
        this.universe,
        Buffer([ENTTEC_PRO_END_OF_MSG])
    ]);
    //console.log("MSGLEN:",msg.length);
    this.serial.write(msg)
}

EnttecUSBDMXPRO.prototype.receive = function(datas){
    var len = datas.length;
    console.log("EnttecUSBDMXPRO rcv datas:",len);
    var str = "";
    for(var i=0;i<len;i++){
        var c = datas[i];
        //str += " "+("00" + c.toString(16)).substr(-2);
        str+= String.fromCharCode(48+(c & 0xF)); //serialCode
        str+= String.fromCharCode(48+(c >> 4));
    }
    console.log("rcv:",str);
};

EnttecUSBDMXPRO.prototype.serialNumber = function() {

    var msg = Buffer([
        ENTTEC_PRO_START_OF_MSG,
        ENTECC_PRO_SERNUM_RQ,
        0,0,
        ENTTEC_PRO_END_OF_MSG
    ]);
    this.serial.write(msg);
}

EnttecUSBDMXPRO.prototype.start = function() {
    var self = this;
    this.serial.open(this.serialPath, this.serialBauds, function () {
        console.log("dmx openned");
        self.serialNumber();
    });
};



EnttecUSBDMXPRO.prototype.stop = function() {
    this.serial.close();
}

EnttecUSBDMXPRO.prototype.close = function(cb) {
    this.serial.close()
}

EnttecUSBDMXPRO.prototype.setValues = function(start,buff) {
    for(var c in u) {
        this.universe[start+c] = u[c];
    }
    this.send_universe()
}

EnttecUSBDMXPRO.prototype.update = function(u) {
    //console.log("update:",u);
    for(var c in u) {
        this.universe[c] = u[c]
    }
    this.send_universe()
}

EnttecUSBDMXPRO.prototype.updateAll = function(v){
    console.log("updateAll:",v);
    for(var i = 0; i < 512; i++) {
        this.universe[i] = v
    }
}

EnttecUSBDMXPRO.prototype.getValue = function(c) {
    return this.universe[c]
}

//module.exports = EnttecUSBDMXPRO
*/