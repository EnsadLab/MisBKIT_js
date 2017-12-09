
var oscws = require("ws");
var oscjs = require("osc");
//var http = require("http");

class OscMobilizing{
    constructor(){
        this.enabled = false;
        this.wsSocket;
        this.oscPort;

    }

    onOff(check){
        //console.log("oscMobilizing:",this);
        //console.log("oscMobilizing.OnOff:",check);
        if(check)
            this.open();
        else
            this.close();
        this.enabled = check;
    }

    close(){

        if(this.wsSocket){
            console.log("Closing!");
            this.oscPort.close();
            this.wsSocket.close();
            this.wsSocket=undefined;            
        }
        this.oscPort=undefined;

    }

    open(){
        this.close();
        this.wsSocket = new oscws.Server({
            port: 8080
            ,clientTracking: false
            ,verifyClient: function(info,cb){
                console.log("verify",info);
                if(cb){cb(true);}
                return true;}
        });

        var self = this;
        //wss.on('request',function(){console.log('wss request:')}) //never seen
        this.wsSocket.on("connection", function(socket) {
            console.log("wss connection");
            //wss.on('message', function(msg){console.log('ws rcw:',msg);});
        
            self.oscPort = new oscjs.WebSocketPort({
                socket: socket,
                metadata: true
            });

            self.oscPort.on('error',function(ev){
                console.log("oscPort error:",ev);
            });
        
            self.oscPort.on('open',function(ev){
                console.log("oscPort open:",ev);
            });

            self.oscPort.on('ready',function(ev){
                console.log("oscPort ready:",ev);
            });

            self.oscPort.on('close',function(ev){
                console.log("oscPort close:",ev);
            });

            //test:
            //oscPort.on('message',function(ev){});
            //oscPort.on('raw',function(ev){});

            self.oscPort.on('osc',function(msg){
                console.log("mob osc:",msg);
                oscManager.handleMessage(msg);
                /*
                var addr = msg.address;
                var val  = msg.args[0].value;
                console.log("osc msg:",addr,val);
                this.send({
                    address:"/glop",
                    //args:[{type:"i",value:val}]
                    //args:[+val]
                });
                */      
            });
    

        });
                
    }
}

