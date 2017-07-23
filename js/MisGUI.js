

function MisGUI(){
    var self = this;
    this.rotAngles =[];
    this.rotSpeeds =[];
    this.recording = false;
    this.serialPort = null;

    this.dxlEditId = 0;

    this.settings = [
        {
            index:0,
            Id:0,
            mode:0,
            inverse: 0,
            angleRng:[-150,150],
            speedRng:[-100,1000]
        }
    ];

    $( "#dialog" ).dialog( "close" );

    $('#btSerial').on('click',function(){
        var cl = $(this).prop("class");
        console.log("GUI-cm9Com:",cl);
        if(cl=="connected"){
            cm9Com.close();
            $(this).prop("class","disconnected").text("OFF");
        }
        else {
            self.openSerial();
        }
    });

    $('#selectSerial').change(function(){
        console.log("serialPort:",this.value);
        var bt = $("#btSerial");
        bt.prop('disabled', true); //error may take a long time

        if(this.value == "scan"){
            console.log("SCAN");
            self.scanSerial();
            bt.prop("class","disconnected").text("OFF");
            bt.prop('disabled', false);
            return;
        }
        self.openSerial();
    });


    $('#btMidi').on('click',function(){
        var cl = $(this).prop("class");
        if(cl=="connected"){
            $(this).prop("class","disconnected").text("OFF");
            midiPortManager.close($('#selectMidi').val());
        }
        else {
            if(midiPortManager.open($('#selectMidi').val()) )
                $(this).prop("class","connected").text("ON");
            else
                $('#btMidi').prop("class","disconnected").text("OFF");
        }
    });



    $('#selectMidi').change(function(){
        if(this.value == "scan") {
            console.log("MIDI_SCAN");
            self.scanMidiPorts();
        }
        else {
            /*
            // take away for now the automatic connection when selecting a new port
            if( midiPortManager.open(this.value) )
                $('#btMidi').prop("class","connected").text("ON");
            else
                $('#btMidi').prop("class","disconnected").text("OFF");
            */
            $('#btMidi').prop("class","disconnected").text("OFF");
        }
    });


    $('#btOSC').on('click',function(){
        var cl = $(this).prop("class");
        if(cl=="connected"){
            cm9Com.close();
            $(this).prop("class","disconnected").text("OFF");
        }
        else {
            cm9Com.open();
            $(this).prop("class","connected").text("ON");
        }
    });



    var inputs = $("#divDxlReg :input");
    inputs.change(function(toto){
        var id = $("#btAdvID").val();
        var addr = +this.name;
        var val  = +this.value;
        console.log("inputs.change:",id,addr," ",val);
        if(addr == 3){
            dxlEditId = val;
            console.log("dxlEditId",val);
        }
        else
            dxlManager.dxlWrite(id,addr,val);
    });
    inputs.keypress(function(e){
        console.log("inputs.keypress<", e.which);
        console.log("inputs.keypress:",this.id,this.name," ",this.value);
        if(e.which==13){
            //$(this).trigger("change");
            $(this).change();
        }
    });
    //inputs.focusout(function(toto){
    //    console.log("inputs.focusout:",this.name," ",this.value);
    //});



}; //MisGUI



MisGUI.prototype.cmd = function(cmd,index,args) {
    console.log("gui command: ",index," cmd:",cmd," arg:",args);
    if(this[cmd]){
        this[cmd](index,args);
    }
}

MisGUI.prototype.serialState=function(state){
    var bt = $("#btSerial");
    if(state=='OFF')
        bt.prop("class","disconnected").text("OFF");
    else if(state=='ON')
        bt.prop("class", "connected").text("ON");
    else
        bt.prop("class", "error").text("ERROR");
    bt.prop('disabled',false);
    this.blockUI(false);
}


//TODO cm9Com.open --> manager
/*
MisGUI.prototype.openSerial = function(port) {
    if(port==undefined)port = $('#selectSerial').val();
    else{
        this.serialPort = port;
        $('#selectSerial').val(port);
    }
    this.serialPort = port;
    var bt = $("#btSerial");
    console.log("GUIopenserial:",port,":",bt.prop("content"));

    if(port.length<3){
        cm9Com.close();
        this.serialClosed();
        return;
    }

    bt.prop('disabled',true).text("WAIT"); //error may take a long time
    cm9Com.open(port,115200,function(err) {
        bt.prop('disabled',false);
        if (err) {
            bt.prop("class", "error").text("ERROR");
            console.log("MISGUI cm9Com:", err);
        }
        else {
            bt.prop("class", "connected").text("ON");
        }
    });
};
*/
MisGUI.prototype.openSerial = function(port) {
    if(port==undefined)port = $('#selectSerial').val();
    else{
        this.serialPort = port;
        $('#selectSerial').val(port);
    }
    this.serialPort = port;
    var bt = $("#btSerial");

    if(port.length<3){
        dxlManager.serialOnOff(false);
        return;
    }

    bt.prop('disabled',true).text("WAIT"); //error may take a long time
    this.blockUI(true);
    dxlManager.serialOnOff(true,port);
};


MisGUI.prototype.openOSC = function(remoteAddr,remotePort) {
    dxlManager.openOSC(remoteAddr,remotePort);
};

MisGUI.prototype.oscState=function(state){
    var bt = $("#btOSC");
    if(state=='OFF')
        bt.prop("class","disconnected").text("OFF");
    else if(state=='ON')
        bt.prop("class", "connected").text("ON");
    else
        bt.prop("class", "error").text("ERROR");
    bt.prop('disabled',false);
    //this.blockUI(false);
}


/*
MisGUI.prototype.midiPort = function(name) {
    $('#selectMidi').val(name);
    var bt = $("#btMidi");
};
*/

// TODO: what was the use of this?
MisGUI.prototype.midiPortManager = function(name) {
    $('#selectMidi').val(name);
    var bt = $("#btMidi");
};

//TODO check exist , ... remove ... verifier ...
MisGUI.prototype.dxlID =function(index,val) {
    console.log("dxlID:", val);

    if(val.startsWith("#")){
        this.changeDxlID(index,val);
        return;
    }

    dxlManager.cmd("dxlID",index,+val);
    //var div = $("#divMotors .single-motor").eq(index);
    //div.find(".identity").text(val); //TODO .showParams -> #dxlID
    this.getMotorUI(index).find(".identity").text(+val);
    this.getMotorStg(index).find("[name=dxlID]").val(+val);
}

MisGUI.prototype.clockwise =function(index,val){
    dxlManager.cmd("clockwise",index,+val);
}

MisGUI.prototype.angleMin =function(index,val){
    dxlManager.cmd("angleMin",index,+val);
    this.rotAngles[index]
        .setDomain(+val)
        .setRange(+val)
        .setMinMax(+val);
}
MisGUI.prototype.angleMax =function(index,val){
    val = +val;
    dxlManager.cmd("angleMax",index,val);
    this.rotAngles[index]
        .setDomain(undefined,val)
        .setRange(undefined,val)
        .setMinMax(undefined,val);
}
MisGUI.prototype.speedMin =function(index,val){
    console.log("GUI.speedMin",val);
    val=+val;
    dxlManager.cmd("speedMin",index,val);
    this.rotSpeeds[index]
        .setDomain(-175,175)
        .setRange(val,undefined)
        .setMinMax(val);
    console.log("gui-SPEEDMIN:",val);
}
MisGUI.prototype.speedMax =function(index,val){
    val=+val;
    dxlManager.cmd("speedMax",index,val);
    this.rotSpeeds[index]
        .setDomain(-175,175)
        .setRange(undefined,val)
        .setMinMax(undefined,val);
    console.log("gui-SPEEDMAX:",val);
}

MisGUI.prototype.mode =function(index,value){
    console.log("SETMODE:",index," ",value);
    switch(+value){
        case 0:this.joint(index);break;
        case 1:this.wheel(index);break;
    }
}

MisGUI.prototype.joint = function(index){
    dxlManager.cmd("joint",index);
    this.rotSpeeds[index].show(false);
    this.rotAngles[index].show(true);
};
MisGUI.prototype.wheel =function(index){
    dxlManager.cmd("wheel",index);
    this.rotAngles[index].show(false);
    this.rotSpeeds[index].show(true);
    this.rotSpeeds[index].setValue(0);
};

MisGUI.prototype.onRotary = function(val,rot){
    //console.log("ROTARY:",val," ",rot.userData);
    dxlManager.cmd(rot.userData.f,rot.userData.i,val);
};

MisGUI.prototype.setValue = function(index,name,val){
    var div = $("#dxlConfig .motorParam").eq(index);
    div.find("input[name="+name+"]").val(val);
}

MisGUI.prototype.angle = function(index,val){
    if(index<this.rotAngles.length)
        this.rotAngles[index].setValue(+val);
}

MisGUI.prototype.speed = function(index,val){ //!!!base100
    if(index<this.rotSpeeds.length)
        this.rotSpeeds[index].setValue(+val);
}

MisGUI.prototype.needle = function(index,val){
    if(index<this.rotAngles.length) {
        this.rotAngles[index].setNeedle(+val);
        this.rotSpeeds[index].setNeedle(+val);
    }
}

MisGUI.prototype.normValue=function(index,val)
{
    if(index<this.rotAngles.length)
        this.rotAngles[index].setNormValue(+val,false);
}

MisGUI.prototype.recCheck=function(index,val)
{
    console.log("recCheck:[",index,"]",val);
    dxlManager.cmd("recCheck",index,val);
}


MisGUI.prototype.test = function(){

}

MisGUI.prototype.getMotorUI = function(index){
    return $("#divMotors .single-motor").eq(index);
}
MisGUI.prototype.getMotorStg = function(index){
    return $("#divMotorSettings .single-motor").eq(index);
}


MisGUI.prototype.changeDxlID=function(index,val){
    var id = parseInt(val.substr(1));
    if(dialog){
        var bt = dialog.showMessageBox({
            type:"question",
            //title:"change ID to "+val+" ?", //OSX: no title ???
            message:"change ID to "+val+" ?",
            buttons:["Cancel","Ok"]
        });
        console.log("Dialog Button:",bt);

        if(bt==1) {//OK
            console.log("Write ID:", id);
            dxlManager.writeDxlId(index, id);
        }

        this.motorSettings(index,dxlManager.getMotorSettings(index));

    }
}

MisGUI.prototype.alert = function(msg){
    if(dialog){
        var bt = dialog.showMessageBox({
            type:"error",
            //title:"change ID to "+val+" ?", //OSX: no title ???
            message:msg,
            buttons:["Ok"]
        });
    }
}


MisGUI.prototype.toggleAdvanced = function(onoff){
    console.log("MisGUI.prototype.toggleAdvanced",onoff);
    if(onoff) { //current state
        for(var i=0;i<6;i++){
            var parent = this.getMotorUI(i);
            var chk = parent.find("[name=enable]").prop("checked");
            console.log("DBG-check:",i," ",chk);
            if(chk)
                dxlManager.cmd("enable",i,true);

        }
    }
    else
        dxlManager.stopAll();
}

MisGUI.prototype.motorSettings = function(index,s){
    if(s==null)//TODO default
        return;

    //console.log("DBG_motorSettings:",index,s);
    //console.log("DBG_motorSettings ID:", s.id);


    var parent = this.getMotorUI(index);
    parent.find(".identity").text(s.id);
    parent.find("[name=enable]").prop("checked",s.enabled);
    parent.find("[name=mode]").prop("checked",(s.mode!=0));

    var parent = this.getMotorStg(index);
    parent.find("[name=dxlID]").val(s.id);
    parent.find("[name=clockwise]").prop("checked",!s.clockwise);
    parent.find("[name=angleMin]").val(s.angleMin);
    parent.find("[name=angleMax]").val(s.angleMax);
    parent.find("[name=speedMin]").val(s.speedMin); //*(100/1023));
    parent.find("[name=speedMax]").val(s.speedMax); //*(100/1023));

    this.angleMin(index,s.angleMin);
    this.angleMax(index,s.angleMax);
    this.speedMin(index,s.speedMin);
    this.speedMax(index,s.speedMax);

    this.rotAngles[index].show((s.mode==0));
    this.rotSpeeds[index].show((s.mode==1));
    this.rotSpeeds[index].setValue(0);

}

MisGUI.prototype.init =function(){
    console.log("----- INIT GUI");
    var parent = $("#divAnims").find("[name=listAnims]");
    var tanim = parent.find(".single-anim:first");
    tanim.hide();

    var self = this;

    //clone MotorsConfig(advanced)
    //var parent = $("#dxlConfig");
    var model = $("#divMotorSettings .single-motor");
    var after = model;
    model.data("index",0);
    model.find(".cmdTog").data("index",0);
    model.find(".cmd").data("index",0);
    for(var i=1;i<6;i++) {
        var clone = model.clone();
        clone.data("index",i);
        clone.find(".cmd").data("index",i);
        clone.find(".cmdTog").data("index",i);
        clone.insertAfter(after);
        after = clone;
    }

    // clone single-motors
    var parent = $("#divMotors");
    model = parent.find(".single-motor");
    model.data("index",0);
    model.find(".cmdTog").data("index",0);
    for(var i=1;i<6;i++) {
        var clone = model.clone();
        clone.find(".cmdTog").data("index",i);
        clone.data("index",i);
        clone.appendTo(parent);
    }


    //create rotaries
    var svgAngles = $(".rotAngle");
    var svgSpeeds = $(".rotSpeed");
    svgSpeeds.show();

    var slidopt  = {x:0,y:0};

    var color = "#C0C0C0";
    for(var i=0;i<svgAngles.length;i++) {
        var rota = new DUI.Rotary(svgAngles[i],slidopt);
        rota.setDomain(-150,150).setRange(-150,150).setMinMax(-150,150);
        rota.userData = {i:i,f:"angle"};
        rota.callback = this.onRotary.bind(this);
        this.rotAngles.push(rota);

        var rots = new DUI.Rotary(svgSpeeds[i],slidopt);
        rots.setDomain(-160,160).setRange(-100,100).setMinMax(-100,100);
        //rots.userData = {i:i,f:"speed"};
        rots.userData = {i:i,f:"velocity"};
        rots.callback = this.onRotary.bind(this);
        this.rotSpeeds.push(rots);
    }
    svgSpeeds.hide();

    $("#divMotorSettings .cmd").on('change',function(){
        var index = $(this).data("index");
        var cmd = this.name;
        //var val = parseFloat(this.value);
        //console.log("DBG cmd:",index," ",cmd," ",v);
        self[cmd](index,this.value);
    });


    $(".motors .cmdTog").on('click',function(){
        var v = this.checked ? 1 : 0;
        var index = $(this).data("index");
        var cmd = this.name;
        console.log("toggle:",index," ",cmd," ",v);
        if(self[this.name])
            self[cmd](index,v);
        else
            dxlManager.cmd(cmd,index,v);
    });


    /*V02
    $(".showParams").on("click",function(){
        console.log("showParams");
        var div = $("#dxlConfig:first");
        if(div.css("display")=="none"){
            div.show();
            $("#MotorControls:first").hide();
        }
        else {
            div.hide();
            $("#MotorControls:first").show();
        }
    });
    */

    /* V02
    $("#toggleREC").on("click",function(){
        var onoff = this.value|0;
        if(onoff>0) {
            //misGUI.cloneAnim();
            dxlManager.startRec();
        }
        else
            dxlManager.stopRec();
    });
    */

    $("button.start-rec").on("click",function() {
        if(self.recording){
            self.recording = false;
            dxlManager.stopRec();
            UIstoprecording();
            self.recording = false;
        }
        else{
            UIstartRec(); //!!! avant dxlManager.startRec()
            self.recording = true;
            dxlManager.startRec();
        }
    });

    /*
        $(".playAnim").on("click",function(){
            UIplayAnim();
        var onoff = this.value; //$(this).data("onoff");
        console.log("Play:",onoff); //$(this).data("onoff"));
    });
    */

    $("#loadAnim").on("click",function(){
        //dialog.showOpenDialog({properties:['multiSelections']},function(filenames) {
        // /* versionHTML
        dialog.showOpenDialog({properties:['openFile','multiSelections']},function(filenames) {
            if(filenames){
                for(var i=0;i<filenames.length;i++) {
                    dxlManager.loadAnim(filenames[i]);
                }
            }
        });
        // * /
    });

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

    $("#btScan").on("click",function() {
        dxlManager.startScan();
    });

    $( "#opener" ).click(function() {
        $( "#dialog" ).dialog( "open" );
    });

    /*
    for(var i=0;i<1;i++){
        $( "#dialog" ).append('<br><input type="text"><label>Label :</label>');
    }
    */
    /*
    $("#btDxlIDx").on("change",function(){
        console.log("DxlId:",this.value);
        $('#divDxlReg [id^="addr"]').val("?");
        dxlManager.readRegs(this.value);
    });
    */
    $("#btAdvID").on("change",function() {
        var id = $("#btAdvID").val();
        console.log("#btDxlRefresh click ",id);
        self.clearDxlRegs(+id);
    });
    $("#btAdvID").keypress(function(e){
        if(e.which==13){
            $(this).change();
        }
    });
    $("#btDxlRefresh").on("click",function(){
        $("#btAdvID").change();
    });

    this.scanSerial();
    this.scanMidiPorts();
    this.scanIPv4();


}//init


MisGUI.prototype.clearDxlRegs = function(id) {
    var inputs = $("#divDxlReg :input");
    inputs.val('?');
    $("#btAdvID").val(id);
    dxlManager.startReadDxl(id); //async >> showDxlReg

}

MisGUI.prototype.showDxlReg = function(id,addr,val){
    var nm = ("000"+addr).slice(-3);
    var inp = $('#divDxlReg').find("[name="+nm+"]");
    if(inp){
        inp.val(val);
    }
}


//????
MisGUI.prototype.setDxlReg=function(i,name,val){
    var inp = $( "#divDxlReg #addr"+i).eq(0);
    console.log("inputs:",inp.length);
    if(inp.length<1){
    //if(inp==undefined){
        //$( "#divDxlReg" ).append('<br><input type="text" size="5em" id="addr'+i+'"> '+name);
        inp = $('<br><input type="text" size="5em" id="addr'+i+'">');
        inp.data("addr",i);
        $( "#divDxlReg" ).append(inp,name);
        inp.on("change",function(){
            //misGUI.changeDxlReg()
            console.log("CHANGE REG:",this.id,this.value,$(this).data("addr"));
            dxlManager.writeReg($("#btDxlIDx").val(),$(this).data("addr"),this.value);
        });
    }
    inp.val(val);
/*

    var lbls = $( "#dialog label #addr"+i" );
    console.log("inputs:",inps.length,i);
    if(i<inps.length){
        $(inps[i]).val(val);
        $(lbls[i]).text(" "+name);
    }
    */
}

MisGUI.prototype.recOff=function(){ //V02 ok
    console.log("DBG misGui.recOff 1");
    self.recording = false;
    UIstoprecording();
    self.recording = false;
    console.log("DBG misGui.recOff 2");
}

MisGUI.prototype.dxlEnabled = function(index,val){
    var bt = $("#divMotors .single-motor").eq(index).find("[name=enable]");
    bt.prop("checked",(val!=0));
}


MisGUI.prototype.divAnim = function(animId){
    return $('.single-anim[data-id='+animId+']');
}

MisGUI.prototype.addAnim = function(animId,aName,keyCode) {
    console.log("MisGUI:addAnim:", animId, " ", aName);

    var self = this;
    //var parent = $("#divAnims");
    var parent = $("#divAnims").find("[name=listAnims]");
    var model = parent.find(".single-anim:first");
    var clone = model.clone();
    clone.attr('data-id', animId); //select only find attr
    clone.children().data("id", animId); //only first level !!! !!! !!!

    clone.find("input").attr('data-id', animId);
    clone.find("button").attr('data-id', animId);

    var tracks = clone.find("[name=track]");
    var nt = tracks.length;
    for (var i = 0; i < nt; i++) {
        $(tracks[i]).prop("class", "motor-none");
        $(tracks[i]).data("index", i);
    }

    tracks.on("click", function () {
        var v = this.checked ? 1 : 0;
        console.log("DBG_track:", $(this).data("id"), " i:", $(this).data("index"), " ", v);
        self.track($(this).data("id"));
    });

    clone.find(".close").on("click", function () {
        //killAnim
        var animId = $(this).data("id");
        var a = self.divAnim(animId);
        if (a.length > 0) {
            a.remove();
            dxlManager.removeAnim(animId);
        }
    });

    clone.find(".play").on("click", function () {
        UIplayAnim(this);
        dxlManager.startAnim($(this).data("id"));
    });

    clone.find(".stop").on("click", function () {
        console.log("stop:", $(this).data("id"));
        dxlManager.stopAnim($(this).data("id"));
        UIstopAnim(this);
    });

    clone.find(".loop").on("click", function () {
        var onoff = UIloopAnim(this);
        dxlManager.loopAnim($(this).data("id"), onoff);
    });

    clone.find("[name=animName]")
        .val(aName)
        .on("change", function () {
            var zis = $(this);
            dxlManager.renameAnim(zis.data("id"), zis.val());
        });

    clone.find("[name=animKey]")
        .val(keyCode)
        .on("change",function(){
            var zis = $(this);
            dxlManager.setKeyCode(zis.data("id"),zis.val());
    });


    /*
        //bt.data("id",this.animId);
        bt.on("click",function(){
            var id = $(this).data("id");
            console.log("ClickAnim id:",id," ",this.name);
        }).data("id",animId);
    */


    clone.insertAfter(model);
    clone.show();

}

MisGUI.prototype.playAnim=function(id,v){
    if(v>0)dxlManager.startAnim(id);
    else dxlManager.stopAnim(id);
}

MisGUI.prototype.animCheck=function(animId,v){
    if(v)UIplayAnim(this.divAnim(animId).find(".play"));
    else UIstopAnim(this.divAnim(animId).find(".stop"));
/*V01
    console.log("DBGanimCheck");
    var bt = $('.divAnim[data-id='+animId+']:first').find('[name="playAnim"]:first');
    if(bt.length>0)setToggleBt.call(bt[0],v);
*/
}

MisGUI.prototype.animProgress=function(animId,v) {
    //$('.divAnim[data-id=' + animId + ']:first').find('[name="progress"]:first').val(v);
    var parent = $('.single-anim[data-id='+animId+']');
    parent.find('[name="progress"]:first').val(v);
}

/* V01
MisGUI.prototype.loopAnim=function(id,v){
    dxlManager.loopAnim(id,v);
};
*/

/**
 *
 * @param animId
 * @param tracks {play:true,i:imot,f:"angle"}
 */
MisGUI.prototype.animTracks=function(animId,tracks){
    var parent = $('.single-anim[data-id='+animId+']')
    console.log("DBG_animTracks:",parent.length);
    var bts = parent.find('[name="track"]');
    var nbt = bts.length;
    for(var i=0;i<nbt;i++){
        $(bts[i]).prop("class","motor-none").prop("checked",false);
    }
    for(var i=0;i<tracks.length;i++){
        var im = tracks[i].i; //!!! test nbm
        console.log("DGBtracks:",tracks[i].f);

        if(tracks[i].f=="angle")$(bts[im]).prop("class","motor-angle");
        else if(tracks[i].f=="speed")$(bts[im]).prop("class","motor-speed");
        $(bts[im]).prop("checked",true);
    }

/*V02
    var bts = $('.divAnim[data-id='+animId+']').find('[name="track"]');
    var nbt = bts.length;
    //console.log("showTracks nbt:",nbt," t",tracks.length);
    for(var i=0;i<nbt;i++){
        setToggleBt.call(bts[i],0);
        $(bts[i]).text("");
    }
    var nt = tracks.length;
    for(var i=0;i<nt;i++){
        var im = tracks[i].i; //!!! test nbm
        if(tracks[i].f=="angle")$(bts[im]).text("A");
        if(tracks[i].f=="speed")$(bts[im]).text("S");
        setToggleBt.call(bts[im],1);
    }
    */

};

//V02
MisGUI.prototype.track=function(animId,v) {
    var parent = $('.single-anim[data-id='+animId+']')
    var bts = parent.find('[name="track"]');
    for(var i=0;i<bts.length;i++) {
        var onoff = $(bts[i]).prop("checked");
        console.log("click track:",i," ",onoff);
        dxlManager.animChannel(animId,i,onoff);
    }
}

MisGUI.prototype.scanSerial = function(){
    var self = this;
    var selector = $("#selectSerial");
    selector.empty();
    selector.append($("<option value='' ></option>"));
    cm9Com.list(function(ports){
        for (var i = 0; i < ports.length; i++) {
            var p = ports[i];
            var n = p;
            if (p.indexOf("/dev/") == 0)
                n = p.substring(5);
            selector.append($("<option value=" + "'"+p+"'>" + n + "</option>"));
            if (n.indexOf("usb") >= 0) {
                selector.val(n); //par default
            }
        }
        selector.append($("<option value='scan' >scan</option>"));
        if(self.serialPort != null)
            $("#selectSerial").val(self.serialPort);
    });
};


MisGUI.prototype.scanMidiPorts = function(){
    var self = this;
    var selector = $("#selectMidi");
    selector.empty();
    if(midiPortManager){  
        for(var i=0;i<100;i++){
            var n = midiPortManager.getPortName(i);
            if(n){
                console.log("Found midi port: " + n);
                midiPortManager.addMidiPort(n,i);
                selector.append($("<option value=" + "'" + n + "'>" + n + "</option>"));
            }else
                break;
        }
        selector.append($("<option value='scan' >scan</option>"));
    }
};

MisGUI.prototype.scanIPv4 = function(){
    var self = this;
    var selector = $("#selectOSC");
    selector.empty();
    try {
        var interfaces = OS.networkInterfaces();
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var addr = interfaces[k][k2];
                if (addr.internal == false && (addr.family == "IPv4")) {
                    selector.append($("<option value=" + "'" + addr.address + "'>" + addr.address + "</option>"));
                }
            }
        }
    }catch(e){}
    selector.append($("<option value='scan' >scan</option>"));
}



MisGUI.prototype.blockUI=function(block){
    if(block)
        $.blockUI({ message: null });
    else
        $.unblockUI({onUnblock: function(){}});
}

MisGUI.prototype.scanProgress =function(val){
    $("#scanProgress").val(val);
}
