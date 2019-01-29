
var oscws = require("ws");
var oscjs = require("osc");
//var http = require("http");

class OscMobilizing{
    constructor(){
        this.enabled = false;
        this.ready = false;
        this.wsSocket;
        this.oscPort;

    }

    onOff(check){
        //console.log("oscMobilizing.OnOff:",check);
        if(check)
            this.open();
        else
            this.close();
        this.enabled = check;
    }

    close(){
        this.ready = false;
        if(this.wsSocket){
            console.log("Closing!");
            this.oscPort.close();
            this.wsSocket.close();
            this.wsSocket=undefined;            
        }
        this.oscPort=undefined;

    }

    sendRaw(raw){
    }

    sendOSC(msg){
        if(this.ready){
            try{
            this.oscPort.send(msg);
            }catch(err){} //console.log("mbz:",err)}
        }
    }

    sendValue(addr,val){
        this.sendOsc({
            address:addr,
            args:[{type:"f",value:+val}]
        })
    }

    open(){
        var self = this;
        this.close();
        this.wsSocket = new oscws.Server({
            port: 8080
            ,clientTracking: false
            ,verifyClient: function(info,cb){
                console.log("verify",info);
                if(cb){cb(true);}
                self.ready = true;
                return true;
            }
        });


        //this.wsSocket.on('request',function(){console.log('wsSocket request:')}) //never seen
        this.wsSocket.on("connection", function(socket) {
            console.log("wss connection");
            //wss.on('message', function(msg){console.log('ws rcw:',msg);});
        
            self.oscPort = new oscjs.WebSocketPort({
                socket: socket,
                metadata: true
            });
            /*
            self.oscPort.on('error',function(ev){ //GRRRRRRR
                console.log("oscPort error:",ev);
            });
            */
            self.oscPort.on('open',function(ev){ //never
                console.log("oscPort open:",ev);
            });

            self.oscPort.on('ready',function(ev){ //never
                self.ready = true;
                console.log("oscPort ready:",ev);
            });

            self.oscPort.on('close',function(ev){  //ok
                self.ready = true;
                console.log("oscPort close:",ev);
            });

            //pour test:
            //oscPort.on('message',function(ev){});
            //oscPort.on('raw',function(ev){});

            self.oscPort.on('osc',function(msg){
                //console.log("mob osc:",msg);
                oscManager.handleMessage(msg,true);
                /* // pour tests
                var addr = msg.address;
                var val  = msg.args[0].value;
                console.log("osc msg:",addr,val);
                this.send({
                    address:"/glop",
                    args:[{type:"f",value:val}]
                    //args:[+val]
                });
                */
                /*
                self.sendOSC({
                    address:"/mbk/sensor",
                    args:[
                        //{type:'s',value:this.ID},
                        {type:'f',value:123}
                    ]
                });
                */
            });
    
        });
                
    }
}
var oscmbz = new OscMobilizing();
module.exports = oscmbz;

