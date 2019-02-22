
function MisGUI(){
    console.log("##############################")
    console.log("#          MISGUI            #")
    console.log("##############################")

    var self = this;
    this.rotAngles = {};
    this.rotSpeeds = {};
    this.recording = false;
    //this.dxlEditId = 0;

    $( "#dialog" ).dialog( "close" );

    // not used right now.. leave it in case we want to re-add the scan button
    $('#btMidi').on('click',function(){
        self.scanMidiPorts();
    });

    $('#btmidi').on('click',function(){
        midiPortManager.enabled = this.checked;
        //console.log("*** btmidi", midiPortManager.enabled);
    });

    $('#btcm9').on('click',function(){
        //console.log("btcm9 click",this.checked);
        //var cl = $(this).prop("class");
        if(this.checked){
            cm9Com.open();
            //$(this).prop("class","stopAll").text("OFF");
        }
        else {
            cm9Com.close();
            //$(this).prop("class","connected").text("ON");
        }
    });

    $('#numCm9').on('change',function(){
        console.log("CM9 changed",this.value);
        //$('#btcm9').prop("class","disconnected").text("OFF");
        $('#btcm9').prop("checked",false);
        var v = cm9Com.changeCm9(+this.value);
        this.value=v;
    });

    $(".cm9Plug").on("mouseover",function(){
        //console.log("cm9Plug mouseover");
        cm9Com.checkConnection();
    })
    
}; //MisGUI

//generalisation de ".activ" (cdf MisGUI_sensors)
MisGUI.prototype.radioActivate = function(selector,eltid){
    $(selector).removeClass("activ");
    if(eltid != undefined)
        $(selector).filter("[eltID="+ eltid + "]").addClass("activ");
}

MisGUI.prototype.radioHide = function(selector,eltid){
    $(selector).hide();
    $(selector).filter("[eltID="+ eltid + "]").show();
}

/*
  ex: cloneElement(".single-gizmo",42);
  ex: cloneElement(".single-gizmo","giz42","giz41");
  ex: cloneElement(".single-gizmo");
  @param eltID: the parameter eltID of the new cloned element
  @param afterID: when given, the new cloned element will be inserted after the element with the given afterID
 */
MisGUI.prototype.cloneElement = function(selector,eltID,afterID,afterSelector){ //eltID may be a string
    var model = $(selector).first();      //model MUST be first ---> insertAfter
    if(model.length>0){
        //console.log("CLONE:manager:",model.data("manager"));
        var clone = model.clone(true);
        /*inutile?
        if(clone.data("manager")==undefined){
            console.log("CLONE:copy manager:");
            clone.data("manager",model.data("manager"));
            clone.find("*").data("manager",model.data("manager")); //was undefined ?
        }
        */
        if(eltID != undefined){           //set eltID to all clone elts
            clone.attr("eltID",eltID);
            clone.find("*").attr("eltID",eltID);
        }
        if(afterID != undefined){
            if(afterSelector != undefined){
                var after = $(afterSelector).filter("[eltID="+afterID+"]");
                //console.log("clone after:",after);
                if(after.length>0)
                    clone.insertAfter(after);
                else
                    clone.insertAfter(model);  
            }
            else{
                var after = $(selector).filter("[eltID="+afterID+"]");
                //console.log("clone after:",after);
                if(after.length>0)
                    clone.insertAfter(after);
                else
                    clone.insertAfter(model);  
            }          
        }
        else {
            if(afterSelector != undefined){
                var aftermodel = $(selector).first(); 
                clone.insertAfter(aftermodel);
            } else {
                clone.insertAfter(model);
            }
        }
        clone.show();
        return clone;
    }
}

/*
  ex: removeElement(".single-gizmo","giz42");
*/
MisGUI.prototype.removeElement = function(selector,eltID){
    var elt = $(selector);
    if(eltID != undefined){
        elt = elt.filter("[eltID="+eltID+"]"); //.first(); ALL?
    }
    elt.remove();  
}

MisGUI.prototype.hideElement = function(selector,eltID){
    var elt = $(selector);
    if(eltID != undefined){
        elt = elt.filter("[eltID="+eltID+"]"); //.first(); ALL?
    }
    elt.hide();  
}


/*
    initGUIfunction( myManager, "myManager"); select .myManager & children
    -> manager.cmd(func,eltID,value);
*/

MisGUI.prototype.initManagerFunctions = function(manager,className){
    var parents = $("."+className);
    console.log("GUI_MANAGER:",className,parents.length)

    parents.find("*").each(function(i) {
        var func = $(this).attr("func");
        $(this).data("manager",manager); //inutile ? keep manager ?
        if(func){
            //console.log("INIT:",$(this).prop("tagName"),$(this).prop("type"));

            //TODO ??? click on <p> , <span> , <textarea> ...
            //console.log("INIT:",$(this).prop("manager"),$(this).attr("func"),$(this).prop("type"));

            //$(this).prop("manager",manager); //inutile ? keep manager ?
            switch($(this).prop("type")){
                case "text":
                case "number":
                    $(this).on("keypress",function(e){
                        if(e.keyCode==13){ //trigger change when enter even if not modified
                            //console.log("ENTER:",$(this).data("prevval"),$(this).val());
                            $(this).trigger("change");
                            return false; //but will trhrow change when focus
                        }                            
                    });
                case "select-one": //select
                    //console.log("***",$(this)); 
                    //$(this).on("open",function(){console.log("<>OPEN")});
                    //$(this).on("show",function(){console.log("<>SHOW")});
                    $(this).on("click",function(){
                        console.log("<select>CLICK",$(this).val())
                        //var opts = manager.cmd("getOptions",$(this).attr("eltID"),$(this).val(),$(this).attr("param"));
                        var opts = manager.cmd("getOptions",$(this).attr("eltID"),$(this).val(),$(this).attr("param"));
                        console.log("<select>options",opts)
                        if(opts!=undefined)
                            misGUI.setElementValue($(this),opts)
                    });
                    $(this).on("change",function(){
                        //console.log("INPUTCHANGE:",$(this).data("prevval"),$(this).val());
                        //console.log("FUNCCHANGE:",$(this).attr("eltID"),$(this).attr("param"));
                        //$(this).prop("manager").cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val());                            
                        // CEC: !!!!! Prob avec prop("manager").. pas bien stocké dans la balise
                        //$(this).prop("manager").cmd($(this).attr("func"),$(this).attr("eltID"),$(this).val());
                        
                        var v = $(this).val();
                        if( (v!="")&&( !isNaN(+v)) ) // +"" -> 0 !
                            v=+v;                    //OK: 127.0.0.1 -> NaN
                        console.log("GUI SELECTonchange:",$(this).attr("func"),typeof($(this).val()),v)
                        manager.cmd($(this).attr("func"),$(this).attr("eltID"),v,$(this).attr("param"));
                        //console.log("  ->onchange:",$(this).attr("func"),$(this).attr("eltID"),v,$(this).attr("param"));

                    });
                    //console.log($("function",this.val));
                    break;
                case "checkbox":
                    $(this).on("change",function(){
                        //console.log("========manager:chk:", $(this).attr("false"),$(this).attr("true"));
                        //DB: TODO attr ou data  ["joint","wheel"] or something like ...
                        manager.cmd($(this).attr("func"),$(this).attr("eltID"),$(this).prop("checked"),$(this).attr("param"));
                    });
                    break;
                case "submit":  //button
                    $(this).on("click",function(){
                        console.log("******* BUTTON ******",$(this));
                        // TEST pour le startRecord ds les anims.. j'ai rajouté l'attribut value
                        var v = $(this).attr("value"); // "true","false" --- ou plutôt 0,1 ?? .. et ptet pas utiliser l'arg value...
                        var vstring = "true";
                        if(v == "true") vstring = "false";
                        $(this).attr("value",vstring);
                        manager.cmd($(this).attr("func"),$(this).attr("eltID"),true,$(this).attr("param")); //value? param? ... à discuter                           
                        //manager.cmd($(this).attr("func"),$(this).attr("eltID"),vstring,$(this).attr("param")); //value? param? ... à discuter                           
                    });
                    break;
                default:
                    //console.log("initManagerFunctions: UNHANDLED:",$(this).prop("tagName"),$(this).prop("type"),func);    
                break   
            }
        }
    });
}

MisGUI.prototype.setEltID=function(classname,id){
    console.log("setEltID:",classname,$("."+classname).find("*").length);
    $("."+classname).find("*").attr("eltID",id);
}

MisGUI.prototype.fillEltID = function(selector,eltID){
    var dest = $(selector).first(); //?first? //TODO: changeEltID  previous -> newone
    dest.attr("eltID",eltID);
    dest.find("*").attr("eltID",eltID);
}

MisGUI.prototype.changeSettings = function(className,func,params,eltID){
    for( var p in params ){
        this.setManagerValue(className,func,params[p],eltID,p);//class func val id param
    }
}

//opt: {class:classname,id:eltID,func:func,param:param,val:value}
MisGUI.prototype.showValue=function(opt){
    var sel = "."+opt.class+" ";
    if(opt.id!=undefined)sel+="[eltID="+opt.id+"]";
    if(opt.func!=undefined)sel+="[func="+opt.func+"]";
    if(opt.param!=undefined)sel+="[param="+opt.param+"]";
    var elts = $(sel);
    //console.log("showValue",opt,elts.length)
    if(elts.length > 0){
        this.setElementValue(elts,opt.val);
    }
    else console.log("*****GUIVALUE NOT FOUND:",sel);
}

//opt: {class:classname,id:eltID,func:func,val:settings}
MisGUI.prototype.showParams=function(opt){
    //console.log("MisGUI.showParams:",opt)
    var sel = "."+opt.class+" ";
    if(opt.id!=undefined)sel+="[eltID="+opt.id+"]";
    if(opt.func!=undefined)sel+="[func="+opt.func+"]";
    var elts = $(sel);
    if(elts.length > 0){
        for( p in opt.val ){
            var e = elts.filter("[param="+p+"]");
            if(e.length>0){
                this.setElementValue(e,opt.val[p]);
            }
            //else console.log("showParam:notfound",p);
        }
    }
    else console.log("*****GUIPARAMS NOT FOUND:",sel);
}

//old implementation , for compatibility.  ---> showValue
MisGUI.prototype.setManagerValue = function( className , func , value , eltID, param){   
    var sel = "."+className+" ";
    if(eltID)sel+="[eltID="+eltID+"]";
    if(func)sel+="[func="+func+"]";
    if(param)sel+="[param="+param+"]";
    var elt = $(sel);
    if(elt.length > 0){
        this.setElementValue(elt,value);
    }
    //else console.log("***** GUIVALUE NOT FOUND:",sel);
}

MisGUI.prototype.setElementValue = function(elt,value){
    var self = this;
    elt.each(function(i){ //mutiples elements may handle same value
        var e =$(this);
        switch(e.prop("tagName")){
            case "INPUT":
                switch( e.prop("type") ){
                    case "text":
                    case "number":
                        e.val(value);
                    break;
                case "checkbox":
                    //console.log("CHECKBOX",value);
                    if(e.is(".onoff")) self.onoffState(e,value); //ON , OFF , ERROR
                    else e.prop("checked",value);    
                    break;
                default:
                    console.log("GUIvalue: not handled: INPUT:",func,e.prop("type"));
                }
                break;
            case "SELECT":
                if(Array.isArray(value)){ //fill options with value(s)
                    //console.log("select:values[]:",value);
                    e.each(function(i) {  //value != for each ones
                        var prev = $(this).val();
                        //console.log("select:prev:",prev);
                        $(this).empty();
                        for(var i=0;i<value.length;i++){
                            if(value[i].length>0)
                                $(this).append($("<option value=" + "'" + value[i] + "'>" + value[i] + "</option>"));
                        }
                        if( (prev==null)||(prev=="default") ){
                            $(this).val(value[0]);
                            $(this).trigger("change");
                        }
                        else{
                            $(this).val(prev);
                        }
                    });
                }
                else{
                    console.log("showSelection",value,$(this).find("option[value='"+value+"']").length )
                    if($(this).find("option[value='"+value+"']").length>0)e.val(value);
                    else e.prop("selectedIndex", 0); //select first option par defaut
                }
                break;            
            case "P":
            case "SPAN":
            case "TEXTAREA":
            case "DIV":
                e.text(value); // elt.html(value); //TO DISCUSS
                break;
            default:
                console.log("GUIvalue: type?:",func,param,elt.prop("tagName"),e.prop("type"),elt);
        }//switch prop
    });//each elt    
}

/*
  <input type="checkbox" func="xxx" class="onoff"> 
  onoffState( $(this),"ERROR");
*/
MisGUI.prototype.onoffState = function( dolzis , state){
    //console.log("MisGUI.prototype.checkState",state);
    switch(state){
        case false:
        case "OFF":
        case 0:
            dolzis.prop("checked",false);
            dolzis.removeClass("error");
            break;            
        case true:
        case "ON":
        case 1:
            dolzis.removeClass("error");
            dolzis.prop("checked",true);
            break;
        case "ERROR":
            console.log("MisGUI.prototype.onoffState ERROR");
        case 3:
            dolzis.addClass("error");
            dolzis.prop("checked",false);
            break;
    }
}

MisGUI.prototype.cmd = function(cmd,index,args) {
    console.log("gui command: ",index," cmd:",cmd," arg:",args);
    if(this[cmd]){
        this[cmd](index,args);
    }
}

MisGUI.prototype.cm9State=function(state){
    console.log("??????????? DELETE ???????????? MisGUI.prototype.cm9State",state);
    var bt = $("#btcm9");
    switch(state){
        case "ON":
        case true:
            bt.removeClass("error");
            bt.prop("checked",true);
            break;
        case "ERROR":
            bt.addClass("error");
            bt.prop("checked",false);
            this.cm9Info("ERROR");
            break;
        case "OFF":
        case false:
            bt.prop("checked",false);
            this.cm9Info("");
            break;            
    }
}

MisGUI.prototype.cm9Info=function(txt){
    $("#cm9Text").html(txt);
}
    
// TODO: what was the use of this?
MisGUI.prototype.midiPortManager = function(name) {
    $('#selectMidi').val(name);
    var bt = $("#btMidi");
};

MisGUI.prototype.angleMin =function(index,val){
    val = +val
    //Didier:[-150,150] à contre coeur (Mx28 et autres)
    //       mais je cede à la demande
    if(val<-150){val = -150;this.showParams({class:"dxlManager",id:index,val:{angleMin:val}})} //GRRR
    if(val>150) {val =  150;this.showParams({class:"dxlManager",id:index,val:{angleMin:val}})}

    if(this.rotAngles[index]){
    this.rotAngles[index]
        .setDomain(+val)
        .setRange(+val)
        .setMinMax(+val);
    }
}

MisGUI.prototype.angleMax =function(index,val){
    val = +val
    //Didier:[-150,150] à contre coeur (Mx28 et autres)
    //       mais je cede à la demande
    if(val<-150){val = -150;this.showParams({class:"dxlManager",id:index,val:{angleMax:val}})} //GRRR
    if(val>150) {val =  150;this.showParams({class:"dxlManager",id:index,val:{angleMax:val}})}

    if(this.rotAngles[index]){
        this.rotAngles[index]
        .setDomain(undefined,+val)
        .setRange(undefined,+val)
        .setMinMax(undefined,+val);
    }
}
MisGUI.prototype.speedMin =function(index,val){
    val=+val;
    // min & max in html doesnt work with manual input
    if(val<-100){val = -100;this.showParams({class:"dxlManager",id:index,val:{speedMin:val}})} //GRRR
    if(val>100) {val =  100;this.showParams({class:"dxlManager",id:index,val:{speedMin:val}})}
    dxlManager.cmd("speedMin",index,val);
    if(this.rotSpeeds[index]){
        this.rotSpeeds[index]
        .setDomain(-175,175)
        .setRange(val,undefined)
        .setMinMax(val);
    }
    //console.log("gui-SPEEDMIN:",val);
}
MisGUI.prototype.speedMax =function(index,val){
    //console.log("GUI.speedMax",val);
    val=+val;
    if(val<-100){val = -100;this.showParams({class:"dxlManager",id:index,val:{speedMax:val}})} //GRRR
    if(val>100) {val =  100;this.showParams({class:"dxlManager",id:index,val:{speedMax:val}})}
    dxlManager.cmd("speedMax",index,val);
    if(this.rotSpeeds[index]){
        this.rotSpeeds[index]
        .setDomain(-175,175)
        .setRange(undefined,val)
        .setMinMax(undefined,val);
    }
    //console.log("gui-SPEEDMAX:",val);
}

// >>>> dxlManager.midiMapping(EltID,value,"mode")
MisGUI.prototype.midiMode =function(index,value){
    console.log("TODELETE? MisGUI.midiMode",index," val",value);
    /*
    switch(+value){
        case 0:motorMappingManager.setMidiMotorMappingCmd(index,"CC");break;
        case 1:motorMappingManager.setMidiMotorMappingCmd(index,"note");break;
    }
    */
}

MisGUI.prototype.motorMode =function(index,value){
    if(this.rotSpeeds[index]){
        switch(value){
            case false: case 0: case "J": case "joint":
                //this.joint(index);
                this.rotSpeeds[index].show(false);
                this.rotAngles[index].show(true);
                //value updated ?
                break;
            case true: case 1: case "W": case "wheel": case -1://off mode
                //this.wheel(index);
                this.rotAngles[index].show(false);
                this.rotSpeeds[index].show(true);
                this.rotSpeeds[index].setValue(0);
                this.motorSpeed(index,0); //set Rotary & input         
                break;
        }
    }
}

MisGUI.prototype.onRotary = function(val,rot){
    //console.log("ONROTARY:")
    var i=rot.userData.i;    
    dxlManager.cmd(rot.userData.f,i,val); //"angle" "speed"
    //this.inputVals.eq(i).val(val.toFixed(1));
    
    //var numrot = 
    $("#divMotors .num_rotary").filter("[eltID="+i+"]").val(val.toFixed(1));
    //console.log("onrotary:numrot",numrot);
};

MisGUI.prototype.setCM9Num = function(n){
    //console.log("misGUI.setCM9Num:",n);
    if(n==0){
        $('#numCm9').hide();    
    }
    else{
        $('#numCm9').val(n);
        $('#numCm9').show();
        //$('#btcm9').prop("checked",false);
    }
}

MisGUI.prototype.setValue = function(index,name,val){
    var div = $("#dxlConfig .motorParam").eq(index);
    div.find("input[name="+name+"]").val(val);
}

MisGUI.prototype.motorAngle = function(index,val){
    //console.log("MisGUI.angle",index,val);
    if(this.rotAngles[index]){
        var v = this.rotAngles[index].setValue(+val).value;
        $("#divMotors .num_rotary").filter("[eltID="+index+"]").val(v.toFixed(1));
    }
}

MisGUI.prototype.motorSpeed = function(index,val){ //[-100,100]
    if(this.rotSpeeds[+index]){
        var v = this.rotSpeeds[+index].setValue(+val).value;
        $("#divMotors .num_rotary").filter("[eltID="+index+"]").val(v.toFixed(1));
    }
}

MisGUI.prototype.needle = function(index,val){
    if(this.rotAngles[index]){
        this.rotAngles[index].setNeedle(+val);
        this.rotSpeeds[index].setNeedle(+val);
    }
}

MisGUI.prototype.getMotorUI = function(index){
    return $("#divMotors .single-motor").filter("[eltID="+index+"]");
}
MisGUI.prototype.getMotorStg = function(index){
    //return $("#divMotorSettings .single-motor").eq(index);
    return $("#divMotorSettings .single-motor").filter("[eltID="+index+"]");
}

MisGUI.prototype.alert = function(msg){
    var bt = dialog.showMessageBox({
        type:"error",
        message:msg, //OSX
        title:msg,   //others
        buttons:["Ok"]
    });
}

//TO DELETE ? : never called ?  ui.js ?
MisGUI.prototype.toggleAdvanced = function(onoff){ //true='normal' false='advanced'
    console.log("********************* MisGUI.prototype.toggleAdvanced",onoff);
    console.log("????? TO DELETE ????? MisGUI.prototype.toggleAdvanced",onoff);
}

MisGUI.prototype.addMotor = function(index,settings){
    //TODO check if index already exists

    //console.log("MisGUI.addMotor",index);
    var cl1 = this.cloneElement("#divMotors .single-motor",index,index-1);
    var cl2 = this.cloneElement("#divMotorSettings .single-motor",index,index-1);

    var svgAngles = cl1.find(".rotAngle").first();
    var svgSpeeds = cl1.find(".rotSpeed").first();    
    //prevent scrolling with mousewheel
    svgAngles.on("mousewheel",function(e){e.preventDefault();});
    svgSpeeds.on("mousewheel",function(e){e.preventDefault();});

    svgAngles.show(); svgSpeeds.hide();//>>>boundrect ok
    var slidopt  = {x:0,y:0};
    var rota = new DUI.Rotary(svgAngles[0],slidopt);
    rota.setDomain(-150,150).setRange(-150,150).setMinMax(-150,150);
    rota.userData = {i:index,f:"angle"};
    rota.callback = this.onRotary.bind(this);
    this.rotAngles[index]=rota;

    svgAngles.hide(); svgSpeeds.show(); //>>>boundrect ok
    var rots = new DUI.Rotary(svgSpeeds[0],slidopt);
    rots.setDomain(-160,160).setRange(-100,100).setMinMax(-100,100);
    rots.userData = {i:index,f:"speed"}; //was velocity
    rots.callback = this.onRotary.bind(this);
    this.rotSpeeds[index]=rots;

    svgSpeeds.hide(); svgAngles.show(); //joint par defaut

    this.showValue({class:"dxlManager",id:index,param:"index",val:index});
    if(settings)
        this.motorSettings(index,settings);
    
}

MisGUI.prototype.motorSettings = function(index,s){
    if((s==undefined)||(s==null)){//TODO defaults ?
        return;
    }

    this.showParams({class:"dxlManager",id:index,val:s});
    $(".thermo [eltID="+index+"]").text("-°"); //wait info from cm9
    //update rotaries
    this.angleMin(index,s.angleMin);
    this.angleMax(index,s.angleMax);
    this.speedMin(index,s.speedMin);
    this.speedMax(index,s.speedMax);
    //update mode
    this.motorMode(index,s.mode); // show/hide rotary , speed at 0
}


MisGUI.prototype.midiMotorSettings = function(midiMappingSettings,midiPorts){
    //console.log("MisGUI.prototype.midiMotorSettings",midiPorts);
    var idx = midiMappingSettings.motorIndex;
    var mod = (midiMappingSettings.cmd == "note"); //CC:false note:true
    var num = midiMappingSettings.nbID;
    //var port = midiMappingSettings.port;
    this.showParams({
        class:"dxlManager"
        ,func:"midiMapping"
        ,id:idx
        ,val:{ midiMode:mod , num:num } //, port:["none","test 1","test 2"]}
        });

    this.updateMidiMotorSelection(idx,midiMappingSettings.port,midiPorts);  
}

MisGUI.prototype.updateMidiMotorSelection = function(motorIndex,midiPortSelected,midiPorts){

    //this array should be built in MidiManager ...
    console.log("---------------updateMidiMotorSelection");
    var ports = ["none"]; 
    for(var i=0;i<midiPorts.length;i++){
        var portName = midiPorts[i].portName;
        if(portName.length>0 ){ //&& midiPorts[i].enabledOnGUI){
            ports.push(portName);
        }
    }

    this.showValue({class:"dxlManager",id:motorIndex,param:"port",val:ports});
    //selectMidiMappingPort //default = first option  ("none")
    this.showValue({class:"dxlManager",id:motorIndex,param:"port",val:midiPortSelected});
}

MisGUI.prototype.init =function(){
    console.log("----- INIT GUI -----");

    var self = this;
    
    // work around
    this.ctrlStopAll = 0;

    this.initMotorDiv();

    // ??? is it used??
    // --> NO....
    $("#saveAnim").on("click",function(){
        if(dialog) {
            // / *versionHTML
            console.log("saveAnim..."); //properties
            dialog.showSaveDialog(function (filenames) {
                if (filenames) {
                    console.log(filenames.length);
                    console.log(filenames[0]);
                    var slash = filenames[0].lastIndexOf('/') + 1;
                    var path = filenames[0].substr(0, slash);
                    var name = filenames[0].substr(slash);
                    console.log(path, " ", name);

                }
            });
        }
    });

    $("#anim-freeze").on('click',function(){
        if($('#anim-freeze').is(":checked")){
            console.log("---- anim stop all");
            //animManager.stopAll();
            //dxlManager.stopAllMotors();
            dxlManager.stopAll();
        }
    });

    $("#sensor-freeze").on('click',function(){
        if($('#sensor-freeze').is(":checked")){
            console.log("----- sensor freeze all");
            sensorManager.freezeAllSensors();
            dxlManager.stopAllMotors();
        }else{
            console.log("----- sensor unfreeze all");
            sensorManager.unfreezeAllSensors();
        }
    });

    // hide default sensor, also when no sensors are loaded
    var parentS = $(".sensors").find("[name=listSensors]");
    var modelS = parentS.find(".single-sensor:first");
    modelS.hide();

    $("#btScan").on("click",function() {
        $("#btScan").css('background', 'white');
		$("#btScan").css('color', 'black');
        dxlManager.startScan();
    });

    $( "#opener" ).click(function() {
        $( "#dialog" ).dialog( "open" );
    });

    $("#addEmptySensor").on("click",function(){
        sensorManager.addEmptySensor();
    })
    
    $(".midiPlug").bind("mouseenter", midiPanelOver);//mouseover
    function midiPanelOver(){
        //console.log("midi over");
        misGUI.scanMidiPorts();
    }

    this.scanIPv4(); //A sortir de là

    this.initScriptEditor();

    //FREEZE MOTORS
    $("input.btnGlobalMotor").bind('click', function() {
        if($(".allMotors").hasClass('freezed')){
            $(".allMotors").css("opacity", 1)
                .css("pointer-events", "auto")
                .removeClass('freezed');
            dxlManager.uiFreeze(false);
        }else{
            $(".allMotors").css("opacity", 0.3)
                .css("pointer-events", "none")
                .addClass('freezed');
            dxlManager.uiFreeze(true);
        }
         
    });
    
}//init

MisGUI.prototype.showFreeze = function(onoff){
    if(onoff){
        $(".allMotors")
            .css("opacity", 0.3)
            .css("pointer-events", "none")
            .addClass('freezed');
    }else{
        $(".allMotors")
            .css("opacity", 1)
            .css("pointer-events", "auto")
            .removeClass('freezed');
    }
}

MisGUI.prototype.initMotorDiv = function(){
    //before addMotor    
    //hide model , will be cloned
    $("#divMotors .single-motor").hide();
    $("#divMotorSettings .single-motor").hide();

    //prevent scrolling with mousewheel
    $(".rotAngle").on("mousewheel",function(e){e.preventDefault();}); //<<<index.js
    $(".rotSpeed").on("mousewheel",function(e){e.preventDefault();}); //<<<index.js
       
    //---- dxlDialog ----
    $(".single-motor").contextmenu(function() { 
        var index = $(this).attr("eltID");
        console.log("motor.contextmenu:",index);
        if(index != undefined){
            $("#dynamixel-ctrl").css("display", "block");
            var dxlID = dxlManager.getIDByIndex(index);     //berk
            misGUI.clearDxlRegs(dxlID); //refresh
            dxlManager.startReadDxl(dxlID); //async >> showDxlReg            
        }
    });

    $("#btAdvID").on("change",function() { //dxlid or refresh
        var id = $("#btAdvID").val();
        misGUI.clearDxlRegs(+id);
        dxlManager.startReadDxl(+id); //async >> showDxlReg            
    });
    $("#btAdvID").keypress(function(e){
        if(e.which==13)
            $(this).change();
    });
    $("#btDxlRefresh").on("click",function(){
        $("#btAdvID").change();
    });
    $("#changeDxlID").keypress(function(e){
        //console.log("KEY:",e);
        if(e.key=='Enter'){
            var prevID = parseInt($("#btAdvID").val());
            if(isNaN(prevID)){
                alert("Scan a valid Motor");
                return;
            }
            var newID = parseInt($(this).val());
            if(isNaN(newID)||(newID<1)||(newID>253)){
                alert("Not a valid Dynamixel ID");
                return;
            }
            if( confirm("Change dynamixel ID #"+prevID+"  to  #"+newID+" ?") ){
                misGUI.clearDxlRegs(newID);
                $("#btAdvID").val(newID);
                dxlManager.changeDxlID(prevID,newID); //->startReadDxl(newID)
            }
        }
    });
}

MisGUI.prototype.openLoadDialog = function( title , path , callback , manager){
    dialog.showOpenDialog({
            title:title, //no effect ???
            message:title, //osX
            defaultPath:path,
            properties:['openFile','multiSelections']
        },
        function(filenames){
            if(callback){
                if(filenames){
                    for(var i=0;i<filenames.length;i++) {
                        console.log("load:",filenames[i]);
                        callback(filenames[i]);
                    }
                } else {
                    console.log("---> no files ---> clicked on cancel");
                    if(manager != undefined) manager.resetLoadDialog();
                }
            }
            console.log("showOpenDialog:DONE")
        }
    );
};

MisGUI.prototype.openSaveDialog = function( title , path , callback ){
    dialog.showSaveDialog({   
            title:title, //no effect ???
            message:title, //osX
            defaultPath:path
        },
        function( filepath ){
            if( (path!=undefined)&&(callback!=undefined) )
                callback(filepath);
        }
    );
};

MisGUI.prototype.recOff=function(){ //V02 ok
    //console.log("DBG misGui.recOff 1");
    self.recording = false;
    UIstoprecording();
    self.recording = false;
    //console.log("DBG misGui.recOff 2");
}

MisGUI.prototype.dxlEnabled = function(index,val){
    var bt = $("#divMotors .single-motor").eq(index).find("[name=enable]");
    bt.prop("checked",(val!=0));
}

// TODO: we leave it for now since it is used by OSC and Sensors
MisGUI.prototype.divAnim = function(animId){
    return $('.single-anim[eltID='+animId+']');
}

//TODO: devrait faire partie de MidiManager , ici on ne fait qu'afficher
MisGUI.prototype.scanMidiPorts = function(){
    console.log("#### MisGUI ----------------> Scanning midi ports");

    var self = this;
    var sel = $("#midi-available");
    sel.empty();

    if(midiPortManager){  
        midiPortManager.hidePortsFromGUI();
        for(var i=0;i<100;i++){
            var n = midiPortManager.getPortName(i);
            if(n){
                console.log("Found midi port: " + n);
                midiPortManager.addMidiPort(n,i);
                sel.append($("<input class=" + "'" + "styled-checkbox small" + "'" + "type=" + "'" + "checkbox"
                + "'" + "id=" + "'" + n + "'>&nbsp;" + n + "<br>"));
            }else
                break;
        }
        $("#midi-available :input[type='checkbox']").each(
            function() {
                var portName =  $(this).prop("id");
                //console.log("PortName ", portName);
                $(this).prop("checked",midiPortManager.isMidiPortEnabled(portName));
                $(this).change(function(){
                    var flag = $(this).prop("checked");
                    //console.log("change ..... TO ",flag);
                    if(flag){
                        midiPortManager.open(portName);
                    }else{
                        midiPortManager.close(portName);
                    }
                });
            }
        );  
        console.log("-----> midi motor mappings",motorMappingManager.motorMappings.length);
        for(var i=0; i<motorMappingManager.motorMappings.length; i++){
            var m = motorMappingManager.motorMappings[i].m;
            this.updateMidiMotorSelection(m.motorIndex,m.port,midiPortManager.midiPorts);
        }

        sensorManager.updateMidiPorts();
    }
};

//??? only in MisGUI 
MisGUI.prototype.simSelectMidiPorts = function(midiEnabled){

    //if(midiEnabled){
        $('#btmidi').prop("checked",midiEnabled);
    //}
    $("#midi-available :input[type='checkbox']").each(
        function() {
            var portName =  $(this).prop("id");
            //console.log("PortName ", portName);
            $(this).prop("checked",midiPortManager.isMidiPortEnabled(portName));
        }
    ); 
}


MisGUI.prototype.scanIPv4 = function(){
    var self = this;
    var infoIP = $(".infoIP");
    var nbIP = infoIP.length;
    for(var i=1;i<nbIP;i++){
        infoIP.eq(i).remove();
    }
    var info = infoIP.eq(0);
    var mbzSrv = "ws://127.0.0.1:8080<br>"; 
    //var selector = $("#selectOSC");
    //selector.empty();
    try {
        var interfaces = OS.networkInterfaces();
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var addr = interfaces[k][k2];
                if (addr.internal == false && (addr.family == "IPv4")) {
                    console.log("localIP:",addr.address);
                    //selector.append($("<option value=" + "'" + addr.address + "'>" + addr.address + "</option>"));
                    var clone = info.clone(info);
                    clone.html("Local IP: "+addr.address);
                    clone.insertAfter(info);
                    info = clone;
                    mbzSrv+="ws://"+addr.address+":8080<br>";          
                }
            }
        }
    }catch(e){}

    $(".mbzIP").html(mbzSrv);
    $(".infoIP").on("click",function(){
        misGUI.scanIPv4();
    })
    $(".mbzIP").on("click",function(){
        misGUI.scanIPv4();
    })
}

MisGUI.prototype.blockUI=function(block){
    if(block)
        $.blockUI({ message: null });
    else
        $.unblockUI({onUnblock: function(){}});
}

MisGUI.prototype.scanProgress =function(val){
    //console.log("scanProgress:",val);
    if(val >= $("#scanProgress").attr('max') - 1){
        $("#scanProgress").val(0);
        $("#btScan").css('background', 'transparent');
		$("#btScan").css('color', 'white');
    }
    else{
        $("#scanProgress").val(val);
    }
}

MisGUI.prototype.temperature = function(index,value){
    var prevt = parseInt($(".thermo").eq(index).html());
    $(".thermo").eq(index).html(value+"°");
    if(prevt==value)
        return;
    var motodiv = $(".single-motor").eq(index);
    if(value>=68){
        motodiv.css("background", "rgba(255,82,97,0.5)");
        motodiv.css("opacity", "0.3");
        motodiv.css("pointer-events", "none");
        motodiv.find(".thermo").css("color", "#FF7F52");
        //$("#alertThermo").css("display", "block");
        //$("#alertThermo").append('<p>Attention ! le moteur '+ $(".single-motor").eq(index).find(".motor-index").html() +' est en surchauffe, il est arrêté.</p>')
        //$("#alertThermo").find('.close-modale').bind('click', function(event) {
        //    $("#alertThermo").css("display", "none");
        //    $("#alertThermo p").remove();
        //});
    }
    else if(value>=60){
        motodiv.css("opacity", "1");
        motodiv.find(".thermo").css("color", "#FF7F52");
        motodiv.css("pointer-events", "auto");
    }
    else{
        motodiv.css("opacity", "1");
        motodiv.find(".thermo").css("color", "#99FF00");
        motodiv.css("background", "");
        motodiv.css("pointer-events", "auto");
    }

}

//---------------- dynamixel dialog box ------------------
MisGUI.prototype.clearDxlRegs = function(dxlid) {
    $("#btAdvID").val(dxlid);
    var inputs = $("#divDxlReg :input");
    //misGUI.setEltID("dxlPopup",dxlID);
    inputs.attr("eltID",dxlid);          //!!! set all inputs'eltID to dxlID !!!
    inputs.val('?');
}

MisGUI.prototype.showDxlReg = function(id,addr,val){ //showValue ?
    var nm = ("000"+addr).slice(-3);
    $('#divDxlReg').find("[param="+nm+"]").val(val);
}

//------------------ editor ------------------------------
MisGUI.prototype.initScriptEditor = function(){
    var editor = scriptEditor; //in ui.js

    // handled by window keydown , to be efective in App (see index.js)
    editor.setOption("extraKeys",{ //prevent to be called twice
        "Cmd-C":function(cm){console.log("Cmd-C")},
        "Cmd-X":function(cm){console.log("Cmd-X")},
        "Cmd-V":function(cm){console.log("Cmd-V")}
    });
    editor.on("cut",function(e){console.log("editor:cut")})
    editor.on("copy",function(e){console.log("editor:copy")})
    editor.on("paste",function(e){console.log("editor:paste")})
}

MisGUI.prototype.getScript = function(){
    return scriptEditor.getValue(); // cf ui.js
}

MisGUI.prototype.setScript = function(code){
    scriptEditor.setValue(code); // cf ui.js
}

MisGUI.prototype.scriptOnOff = function(onoff){
    misGUI.showValue({class:"scriptManager",func:"runStop",val:onoff});
}

//------------------ animations ------------------------------

function echoActiveSetting(){
    var info = $(this).data('label');
    console.log(info);
    var sensor = $(this).closest("li");
    console.log(sensor);
    sensor.find(".echo").html(info)
}


$("input.btnGlobalAnim").bind('click', function() {
    if($(".animations").hasClass('freezed')){
        if(animManager.ctrlAnimStopAll<=0){
            $(".animations").css("opacity", 1);
            $(".animations").css("pointer-events", "auto");
            $(".animations").removeClass('freezed');
            //console.log("normal mode");     
            animManager.ctrlAnimStopAll = 1;   
        } else {
            animManager.ctrlAnimStopAll = 0;
        }
    }else{
        if(animManager.ctrlAnimStopAll<=0){
            $(".animations").css("opacity", 0.3);
            $(".animations").css("pointer-events", "none");
            $(".animations").addClass('freezed');
            console.log("freeze mode");
            animManager.ctrlAnimStopAll = 1;
        } else {
            animManager.ctrlAnimStopAll = 0;
        }
    }
});


// Sensors

$("input.btnGlobalSensors").bind('click', function() {
    if($(".sensors").hasClass('freezed')){
        if(animManager.ctrlSensorStopAll<=0){
            $(".sensors").css("opacity", 1);
            $(".sensors").css("pointer-events", "auto");
            $(".sensors").removeClass('freezed');
            //console.log("normal mode");     
            animManager.ctrlSensorStopAll = 1;   
        } else {
            animManager.ctrlSensorStopAll = 0;
        }
    }else{
        if(animManager.ctrlSensorStopAll<=0){
            $(".sensors").css("opacity", 0.3);
            $(".sensors").css("pointer-events", "none");
            $(".sensors").addClass('freezed');
            console.log("freeze mode");
            animManager.ctrlSensorStopAll = 1;
        } else {
            animManager.ctrlSensorStopAll = 0;
        }
    }
});


//$("input.btnGlobalSensors").bind('click', function() {
$("#script-freeze").bind('click', function() {
    if($(".scripts").hasClass('freezed')){
        if(animManager.ctrlScriptStopAll<=0){
            $(".scripts").css("opacity", 1);
            $(".scripts").css("pointer-events", "auto");
            $(".scripts").removeClass('freezed');
            //console.log("normal mode");     
            animManager.ctrlScriptStopAll = 1;   
        } else {
            animManager.ctrlScriptStopAll = 0;
        }
    }else{
        if(animManager.ctrlScriptStopAll<=0){
            $(".scripts").css("opacity", 0.3);
            $(".scripts").css("pointer-events", "none");
            $(".scripts").addClass('freezed');
            console.log("freeze mode");
            animManager.ctrlScriptStopAll = 1;
        } else {
            animManager.ctrlScriptStopAll = 0;
        }
    }
});

// Midi frontBlink info
var clockForMidiBlink = setInterval(function(){ checkMidiBlink()}, 500);

function checkMidiBlink(){

    $(".single-motor:visible").each(function(index){
        if(motorMappingManager.isMappingActive(index)){
            $(this).find('.midi-blinker').css("display", "block");
        }else{
            $(this).find('.midi-blinker').css("display", "none");
        }
    });
    motorMappingManager.setAllMappingActive(false);
}

MisGUI.prototype.setMidiBlinkOn = function(motorIndex){
    $('.allMotors').find('.single-motor').eq(motorIndex).find('.midi-blinker').css("display", "block");
}

MisGUI.prototype.toggleLuosWifi = function(eltID,usewifi){
    var jqw = $('.luosManager [func=selectWebsocket]');
    var jqs = $('.luosManager [func=selectUSB]');
    jqw = jqw.filter("[eltID="+eltID+"]");
    jqs = jqs.filter("[eltID="+eltID+"]");
    if(usewifi){ jqs.hide(); jqw.show(); }
    else { jqw.hide(); jqs.show(); }
    this.showValue({class:"luosManager",id:eltID,func:"toggleWifi",val:usewifi});
}

//parseBlinker();
function parseBlinker(){
    var elmt = $(".motors-settings .midi-chanel");
    for (var i = 0; i < elmt.length; i++) {
        if(elmt.eq(i).find('option:selected').val() == "none"){
            console.log(elmt.eq(i).find('option:selected').val());
            $('.allMotors').find('.single-motor').eq(i).find('.midi-blinker').css("display", "none");
        }else{
            console.log(elmt.eq(i).find('option:selected').val());
            $('.allMotors').find('.single-motor').eq(i).find('.midi-blinker').css("display", "block");
        }
    };
}


function frontBlinkInfo(){
    var i = $(this).parent().index();
    console.log(i);
    var settingTarget = $(".motors-settings .single-motor").eq(i);
    var infoChanel = settingTarget.find('.midi-chanel option:selected' ).val();
    var indexMapping = settingTarget.find('.midiMapping').val();
    var infoMode;

    if(settingTarget.find('.toggle-small').eq(1).find('input[type="checkbox"]:checked')[0]){
        infoMode = "Note";
    }else{
        infoMode = "CC";
    }

    $(".midi-blinker").prop('title', infoChanel+' - '+infoMode+' - '+indexMapping);

}

// NEW animation modale -- Alex changes
$("#newAnim").bind('click', function(){
    $("#modalNewAnim").css("display", "block");
    $("#modalNewAnim button:first-of-type").prop("disabled",true);

});


//cancel
$("#modalNewAnim").find("#newAnimCancel").bind('click', function(){
    $("#modalNewAnim").css("display", "none"); 
    console.log("close");   
})

//ctrlModalAnim
$(".modalNewAnim").find("span").bind('click', loadAnimmModal);

$("#script-freeze").bind('click', function() {
    if($(".scripts").hasClass('freezed')){
        if(animManager.ctrlScriptStopAll<=0){
            $(".scripts").css("opacity", 1);
            $(".scripts").css("pointer-events", "auto");
            $(".scripts").removeClass('freezed');
            //console.log("normal mode");     
            animManager.ctrlScriptStopAll = 1;   
        } else {
            animManager.ctrlScriptStopAll = 0;
        }
    }else{
        if(animManager.ctrlScriptStopAll<=0){
            $(".scripts").css("opacity", 0.3);
            $(".scripts").css("pointer-events", "none");
            $(".scripts").addClass('freezed');
            console.log("freeze mode");
            animManager.ctrlScriptStopAll = 1;
        } else {
            animManager.ctrlScriptStopAll = 0;
        }
    }
});

function loadAnimmModal(){
    
    //$(".modalNewAnim span").removeClass('selected');
    //$(this).addClass('selected');
    console.log("start",animManager.ctrlModalAnim);
    //console.log("yeeha!!!!!");
    if($(this).hasClass('selected')){
        console.log("a",animManager.ctrlModalAnim);
        //console.log("???????? ------> selected",this.id,"a");
        //console.log("start",animManager.ctrlModalAnim);
        if(animManager.ctrlModalAnim<=0){
            console.log("b",animManager.ctrlModalAnim);
            var selectedType = $(".listAnimType .selected").attr("name");
            console.log("load anim "+ selectedType);
            if(selectedType != undefined){
                console.log("c",animManager.ctrlModalAnim);
                $("#modalNewAnim span").removeClass('selected');
                $("#modalNewAnim").find("#newAnimLoad").css("opacity", 0.3);
                $("#modalNewAnim").css("display", "none"); 
                animManager.addAnim(selectedType);
                animManager.ctrlModalAnim = 1;
                console.log("cc",animManager.ctrlModalAnim);
            }
        } else {
            animManager.ctrlModalAnim = 0;
            console.log("dd",animManager.ctrlModalAnim);
        }
    } else {
        if(animManager.ctrlModalAnim<=0){
            console.log("e",animManager.ctrlModalAnim);
            $(this).addClass('selected');
            $("#modalNewAnim button:first-of-type").css("opacity", 1);
            $("#modalNewAnim button:first-of-type").prop("disabled",false);
            animManager.ctrlModalAnim = 1;
            console.log("ee",animManager.ctrlModalAnim);
        } else {
            animManager.ctrlModalAnim = 0;
            console.log("ff",animManager.ctrlModalAnim);
        }
    }
}
        
var ctrlLoadAnim = 0;
$(".modalNewAnim").find("span").bind('click', loadAnimmModal);

//------------ 2256 ---------- //
