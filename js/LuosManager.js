

const SerialLib  = require('serialport');
const LuosModules = require("./LuosModules.js");


class LuosManager{
    constructor(){
        this.className = "luosManager";
        this.nextGateIndex = 0;
        this.gates = {};
        this.usbPorts = [];
    }

    init(){
        misGUI.initManagerFunctions(this,this.className);
    }

    cmd(func,eltID,arg){ //eltID = gateID
        console.log("LUOS cmd:[",eltID,"]",func,arg)
        if(this[func]!=undefined){ 
            this[func](eltID,arg);
        }
        else if(this.gates[eltID]!=undefined){
            if(typeof(this.gates[eltID][func])=='function')
                this.gates[eltID][func](arg);
        }
    }

    command(objId,func,...args){ //objId = {gate:id,alias:alias}
        let g = this.gates[objId.gate]; 
        if(g!=undefined){
            let m = g.modules[objId.alias];
            if((m!=undefined)&&(m[func]!=undefined))
                return m[func](...args)
        }
    }

    setValue(id,alias,param,value){
        if(this.gates[id]!=undefined){
            this.gates[id].setValue(alias,param,value);
        }
    }

    //opt = {gate:"Luos0",module:"dxl_1",pin:"rot_position"}
    getValue(opt){
        console.log("getvalue:",opt);
        if(this.gates[opt.gate]!=undefined){
            return this.gates[opt.gate].getValue(opt.alias,opt.pin);
        }
    }

    reset(){
        Object.entries(this.gates).forEach(([k,g])=>{ //best than for in ?
            g.reset();
        });        
    }


    closeAll(){
        for( var id in this.gates ){
            this.gates[id].close();
        }    
        misGUI.showValue({class:"luosManager",func:"freeze",val:false});
    }
    
    addGate(settings){
        var id = "Luos"+this.nextGateIndex++;
        this.gates[id]= new LuosModules.Gate(id); 
        //console.log("+++GATE:",this.gates[id]);//???[0]:"L" [1]:"u" ....
        if(settings){
            for( var s in settings ){
                this.gates[id][s] = settings[s]
            }        
        }
        misGUI.cloneElement( ".luosGate",id);
        misGUI.toggleLuosWifi(id,this.gates[id].useWifi);
        return this.gates[id];
    }

    getGates(){
        return Object.keys(this.gates);
    }

    getAliases(gateId){
        if(this.gates[gateId]!=undefined){
            return Object.keys(this.gates[gateId].modules);
        }
        return []
    }

    getOutputs(gateId,alias){
        if(this.gates[gateId]!=undefined){
            if(this.gates[gateId].modules[alias]!=undefined){
                return this.gates[gateId].modules[alias].outputs;
            }
        }
        return [];
    }

    killGate(id){
        misGUI.removeElement(".luosGate",id);
        if(this.gates[id]){
            this.gates[id].close();
            delete this.gates[id];
        }
    }

    saveSettings(){
        var s = {};
        for( var g in this.gates ){
            s[g]=this.gates[g].getSettings()
        }
        var json = JSON.stringify(s, null, 2);
        settingsManager.saveToConfigurationFolder("luos.json",json);
    }

    folderIsReady(){ //dont need to store path : configuration folder
        this.loadSettings()
    }

    loadSettings(){
        console.log("===== LUOS SETTING =====")
        var json = settingsManager.loadConfiguration("luos.json");
        var self = this;
        var count = 0;
        luosManager.scanSerials(function(names){
            if(json){
                var s;
                try{  s = JSON.parse(json); }
                catch(err){ console.log("BAD LUOS SETTINGS ",err)}
                if(s!=undefined){
                    for( var id in s ){
                        var c = s[id].connection;
                        if(c=="wifi"){
                            var gate = self.addGate(id);
                            gate.setWifiName(s[id].wifi);
                            gate.setWifi(true);
                            gate.enable(true);
                            count++;
                            misGUI.toggleLuosWifi(id,true);
                        }
                        else if(c=="usb"){
                            var gate = self.addGate(id);
                            gate.setSerialName(s[id].serial);
                            gate.setWifi(false);
                            gate.enable(true);
                            count++;
                            misGUI.toggleLuosWifi(id,false);
                        }
                    }
                }
            }
            if(count==0){
                console.log("===== LUOS Default gate =====")
                var gate = self.addGate("Luos0"); //default
                gate.setSerialName(names[0]);
                gate.setWifi(false);
            }
        });
    }

    showState(id,state,info){
        console.log("LUOS showState:",id,state,info);
        misGUI.showValue({class:"luosManager",func:"freeze",val:state}); //REMOVE when multi gates
        misGUI.showValue({class:"luosManager",id:id,func:"enable",val:state});
        if(info!=undefined){
            misGUI.showValue({class:"luosManager",id:id,func:"luosInfo",val:info});
        }
    }
     
    scanDxl(){
        for( var g in this.gates ){
            this.gates[g].scanDxl();//--->dxlManager.addLuosBot
        }    
    }

    scanSerials(callback){ //callback(array_of_names)
        console.log("----- Luos scan serials:");
        var self = this;
        this.usbPorts = [];
        var names = [];
        SerialLib.list(function(err, ports) {
            if (err)
                console.log("robus.scanSerials ERROR:", err);
            else {
                //console.log("SerialPorts:",ports.length)
                for (var i = 0; i < ports.length; i++) {
                    //console.log("serials:",ports[i].comName,ports[i].manufacturer);
                    if( (ports[i].manufacturer == "Pollen Robotics")||
                        (ports[i].manufacturer == "Pollen-Robotics")||
                        (ports[i].manufacturer == "Luos-Robotics")) //!!!
                        names.push(ports[i].comName);
                }
                console.log("Luos serials:",names);
                misGUI.showValue({class:"luosManager",func:"selectUSB",val:names});
                self.usbPorts = names;
            }
            if(callback)
                callback(names);
        }); 
    }
}
module.exports = new LuosManager();
