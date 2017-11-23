
const WebSocket = require('websocket').w3cwebsocket;
const dns = require('dns');

class RobusManager{
    constructor(){
        this.robots = {};
    }

    // connect() : connect all 'robots'
    connect(robname){
        if(robname==undefined){
            $.each(this.robots, function(i,rob) {
                rob.open();
            });    
        }
        else{
            if( !(robname in this.robots) ){
                this.robots[robname]=new RobusBot(robname);
            }
            this.robots[robname].open(robname);
        }
    }

    /*
        close("octo_wifi") ou close()
        close the websocket
        !!! dont clear callbacks ( so callbacks after connect()  
    */
    close(botname){
        if(botname in this.robots){
            this.robots[botanme].close();
        }
        else{
            $.each(this.robots, function(i,rob) {
                rob.close();
            });
        }
    }

    //close all robots , remove callbacks , forget robots
    reset(){ //clean all
        
        $.each(this.robots, function(i,rob) {
            rob.close();
            rob.removeAllCallbacks();
        });
        /*
        var robs = this.robots;
        Object.keys(robs).map(function(key,index) {
            console.log("!delelte:",key,index);
            delete robs[key];
        });
        */
        this.robots={};
    }



    //example  robusManager.setCallback("octo-wifi","distance3",this.myfunc.bind(this));
    setCallback(rob,module,cb){
        console.log("robAddr:",rob);
        if( rob in this.robots ){
            this.robots[rob].setCallback(module,cb);
        }
        else{ //allow registration before connect (by settings for example)
            this.robots[rob]=new RobusBot(rob);
            this.robots[rob].setCallback(module,cb);
            //... connect automatically ? 
        }                   
    }

    //removeCallback() remove all callbacks
    //removeCallback("octo_wifi")   remove all callbacks from  octo_wifi
    //removeCallback("octo_wifi","potard2") remove only one callback
    removeCallback(rob,module){
        if(rob==undefined){
            $.each(this.robots, function(i,rob) {
                rob.removeAllCallbacks();
            });
        }
        else if( rob in this.robots ){
            this.robots[rob].removeCallback(module);           
        }
    }

    getInfo(){
        var txt="ROBUS:\n";
        $.each(this.robots, function(i,rob) {
            txt+="-- ";
            txt+=rob.name;
            txt+=" --\n";
            txt+=rob.getInfo();
        });
        return txt;
    }
};