var MisGUI_anims = {}; // namespace javascript simulation


MisGUI_anims.setRecordTracks = function(eltID,tracks){
    var bts = $(".animManager").find("li[eltID='"+ eltID + "']").find("input[name='recTrack']");
    for(var i=0;i<tracks.length;i++){
        var im = tracks[i].i; //!!! test nbm
        console.log("DGBtracks:",tracks[i].f);

        if(tracks[i].f=="angle")$(bts[im]).prop("class","motor-angle");
        else if(tracks[i].f=="speed")$(bts[im]).prop("class","motor-speed");
        $(bts[im]).prop("checked",tracks[i].record);
        //$(bts[im]).prop("checked",false);
    }
}

MisGUI_anims.setPlayingTracks = function(eltID,tracks){
    console.log("setPlayingTracks",tracks);
    var bts = $(".animManager").find("li[eltID='"+ eltID + "']").find("input[name='track']");
    for(var i=0;i<tracks.length;i++){
        var im = tracks[i].i; //!!! test nbm
        console.log("DGBtracks:",tracks[i].f);

        if(tracks[i].f=="angle")$(bts[im]).prop("class","motor-angle");
        else if(tracks[i].f=="speed")$(bts[im]).prop("class","motor-speed");

        ///TODO CECILE:
        ///Il faut utilisé ça sur les moteur selectionné pour les rendre inactif, mais j'arrive pas à comprendre comment les cibler.
        ///.attr("disabled", true);
        
        // $(bts[im]).prop("checked",true);
        $(bts[im]).prop("checked",tracks[i].play);


    }
}

MisGUI_anims.setAnimName = function(eltID, name) {
    var div = $(".animManager").find("li[eltID='"+ eltID + "']").find("input[name='animName']");
    console.log("div",div);
    div.val(name);
}


MisGUI_anims.startRec = function(eltID) {

    console.log("MisGUI_anims::startrec");
    
    var div = $(".animManager").find("li[eltID='"+ eltID + "']");
    div.find(".recordSettings input").prop("disabled",true);
    div.find(".recordSettings input").css("opacity", 0.3);
    
    var divButton = div.find("button.start-rec");
	divButton.css({ 'border': '2px solid rgba(255, 24, 98, 1)' });
	divButton.html("stop recording")
	divButton.css({ 'animation-duration': '1s' });
	$(".switch").css({ 'opacity': '0.3' });
	$(".switch input").attr("disabled", true);

	//cf MisGUI $("button.start-rec").unbind("click", UIstartRec);
	//cf MisGUI $("button.start-rec").bind("click", UIstoprecording);

}

MisGUI_anims.stopRec = function(eltID) {
    console.log("MisGUI_anims::stopRecord");
    var div = $(".animManager").find("li[eltID='"+ eltID + "']");
    //var divButton = div.find("button.start-rec");
    var divButton = div.find("button.start-rec");
    //divButton.addClass("disabled");
    
    
    divButton.html("start recording")
	divButton.css({ 'animation-duration': '0s' });
	$(".switch").css({ 'opacity': '1' });
	$(".switch input").attr("disabled", false);
    div.find(".recordSettings").css("display", "none");
    div.find(".anim-motors").css("display", "block");
    
}

MisGUI_anims.disableStartRec = function(eltID,disable){
    console.log("------------------> setStartRec",disable);
    var div = $(".animManager").find("li[eltID='"+ eltID + "']")
    div.find(".start-rec").attr("disabled",disable);
}


MisGUI_anims.playAnim = function(eltID) {
    var div = $(".animManager").find("li[eltID='"+ eltID + "']").find("button[name='play']");
    div.parent().next(".progress").addClass('active');
	div.css("opacity", 1);
	div.html('<img src="assets/play-green.png" alt="" name="loop">');
}

MisGUI_anims.stopAnim = function(eltID) {
    var div = $(".animManager").find("li[eltID='"+ eltID + "']").find("button[name='stop']");
    div.prev(".play").css("opacity", 0.6);
	div.prev(".play").html('<img src="assets/play.png" alt="" name="loop">');
	//NOOON $(witch).next(".loop").css("opacity", 0.6);
	div.parent().next(".progress").removeClass('active');
}

MisGUI_anims.loopAnim = function(eltID, onoff) {
    var div = $(".animManager").find("li[eltID='"+ eltID + "']").find("button[name='loop']");
    //if(witch==undefined){witch=this;console.log("UIloopAnim1b:undef");}
	try{
        if(onoff==undefined) onoff = (div.css("opacity")!=1); //DB: GRRR Cannot read property 'defaultView' of undefined 
	}catch(e){
        console.log("*** LOOP ERROR ***");onoff=true;
    } //DB: resolved by removing
	if(onoff){
		div.css("opacity", 1);
		div.html('<img src="assets/loop-green.png" alt="" name="loop">');
	}else{
		div.css("opacity", 0.6);
		div.html('<img src="assets/loop.png" alt="" name="loop">');
	}
	console.log("UIloopAnim2:",onoff); //witch.css("opacity"));
	return onoff;
}


MisGUI_anims.animCheck = function(eltID,v){
    if(v) MisGUI_anims.playAnim(eltID);
    else MisGUI_anims.stopAnim(eltID);
}

MisGUI_anims.animProgress = function(eltID,v) {
    var div = $(".animManager").find("li[eltID='"+ eltID + "']");
    var progress_bar = div.find('[name="progress"]:first');
    if(progress_bar.length > 0) progress_bar.val(v);
}

MisGUI_anims.setKeyCode = function(eltID,v) {
    var div = $(".animManager").find("li[eltID='"+ eltID + "']");
    console.log("setKeyCode",div.find('input[name="animKey"]'),"val",v);
    div.find('input[name="animKey"]').val(v);
}


MisGUI_anims.removeAnimation = function(eltID) { 
    if(eltID == undefined){  
        eltID = $("#sortable-anim .selected").attr('eltID');
    }
    console.log("REMOVE ANIMATION",eltID);
    var div = $(".animManager").find("li[eltID='"+ eltID + "']");
    if(div.length > 0) div.remove();
    animManager.removeAnim(eltID);
}

// TODO
MisGUI_anims.resetRecording = function(eltID) {

    var button = $(".animManager").find("li[eltID='"+ eltID + "']").find(".start-rec");
    console.log("in here button",button);
    var self = button.parent().parent();
    //UIstoprecording();
    button.html("start recording");
    
    button.css({
		'animation-duration': '0s'
    });
    $(".switch").css({
		'opacity': '1'
    });
    
    $(".switch input").attr("disabled", false);
    
    toggleRecord = false;
    //self.find(".recordSettings").css("display", "none");
    //self.find(".anim-motors").css("display", "block");
}


