
const readDefault=function(e){
    return 0;
}
const readPotard=function(e){
    return e.position;
}
const readLidar=function(e){
    return e.distance;
}
const readButton=function(e){
    return e.state;
}


class RobusModule{
    constructor(name,evt){
        this.type = null;
        this.value = 0;
        this.readVal  = readDefault;
        this.callback = null;
        this.name = name;
        this.setType(evt);
    }
    update(evt) {
        if(this.type==null)
            this.setType(evt);
        this.value = this.readVal(evt);
        if(this.callback)
            this.callback(this.value);
        return this.value;
    }
    setType(evt) {
        if(evt){
            //console.log("!robus setType:",evt.type);
            this.type = evt.type;
            switch(evt.type){
                case "potard":
                    this.readVal = readPotard;
                    break;
                case "distance":
                    this.readVal = readLidar;
                    break;
                case "button":
                    this.readVal = readButton;
                    break;
                default:
                    this.readVal = readDefault;
                    break;            
            }
        }
        else{
            this.type = null;
            this.readVal = readDefault;            
        }
    }
}

/*
class RobusPotard extends RobusModule{
    update(evt) {
        this.value = evt.position; 
        return this.value;
    }
}

class RobusDistance extends RobusModule{
    update(evt) {
        this.value = evt.distance; 
        return this.value;
    }
}

class RobusButton extends RobusModule{
    update(evt) {
        this.value = evt.state; 
        return this.value;
    }
}
*/



function RobusBot(name){
    this.initialized = false;
    this.name = name;
    this.port = 9342;
    this.detectionInterval = 1000;
    this.ws = null;
    //this.state = {};
    this.msgsToPub = {};
    this.onupdate = null;
    //this.onError = null;
    this.modules = {};

};

RobusBot.prototype.close = function(n) {
    if (this.ws !== null){
        this.ws.close();

    }
    misGUI.robusOnOff(false);
}

RobusBot.prototype.open = function(addr) {
    //misGUI.robusInfo("");       
    var self = this;
    if(this.ws != null){
        this.ws.close();
    }
    misGUI.robusWait();
    this.initialized = false;
    if( addr===undefined )
        addr = this.name;
    else
        this.name = addr;
    
    if(addr.indexOf('.')<0)
        addr+=".local";
    var url = `ws://${addr}:${this.port}`;
    
    this.ws = new WebSocket(url);
    this.ws.onopen = function(){
        console.log(`!Robus Connected to "${url}"!`);
        misGUI.robusOnOff(true);
    };
    this.ws.onerror=function(e){
        misGUI.robusOnOff(false);
        //alert("ROBUS ERROR\n"+addr);
        //var redo = confirm("confirm box");console.log("REDO?",redo);
        //var addr = prompt("ROBUS error",self.name); console.log("prompt:",addr); NOT SUPPORTED
    }
    this.ws.onclose = () => {
        self.ws=null;
        misGUI.robusOnOff(false);
    };
    this.ws.onmessage = e => {
        if(typeof e.data === 'string'){
            //misGUI.robusInfo(e.data);
            var json = JSON.parse(e.data);
            var txt = "";
            var id  = "";
            var v = 0;
            //for( m in json.modules ){
            json.modules.forEach( m => {
                id=`${m.alias}${m.id}`;
                if(self.modules[id])
                    v = self.modules[id].update(m);
                else{
                    self.addModule(m);
                    v=-1;
                }
                txt+= (id+" : "+v+"\n");
            });
        }
    };
}

RobusBot.prototype.sendCommand = function(alias, register, value) {
}

RobusBot.prototype.flushCommands = function() {
}

RobusBot.prototype.setCallback = function(name,cb) {
    console.log("!robusCB:",name)
    if(this.modules[name]){
        console.log("!robusCB:exist",name)
        this.modules[name].callback = cb;
    }
    else{ //cree un module avant la connection, le type sera geré au 1er message
        console.log("!robusCB:create",name)
        this.modules[name]=new RobusModule(name); 
        this.modules[name].callback = cb;        
    }
}

RobusBot.prototype.removeCallback = function(name) {
    if( name in this.modules )
        this.modules["name"].callback = null;
}

RobusBot.prototype.removeAllCallbacks = function() {
    //for( m in this.modules ){
    $.each(this.modules, function(i,rob) {
        rob.callback = null;
    });

}

RobusBot.prototype.addModule = function(md) {
    var id = `${md.alias}${md.id}`;
    this.modules[id]=new RobusModule(id);
    this.modules[id].update(md);
    //console.log("!robus module:",md);
}

RobusBot.prototype.getInfo = function() {
    var txt="";
    $.each(this.modules, function(i,mod) {
        if(mod.callback)
            txt+="*";
        else
            txt+=" ";        
        txt += mod.name;
        txt += " ";
        txt += mod.value;
        txt += "\n";        
    });
    return txt;
}
    