// $( document ).ready(function() {

	//$(document).tooltip();

// 	$(document).tooltip({
// 		//position:{my:"left+15 center", at:"right center"}
// 		//position:{my:"center+15 bottom", at:"center top-20"}
// 		track: true
// 	});

// $( "#dialog" ).dialog({
// 	autoOpen: false,
// 	closeOnEscape: true,
// 	closeText: "X"
// });
// $( "#dialog" ).dialog('close');


/*
	$( "#dialog" ).dialog({
		autoOpen: true,
		minHeight: 700
	});
*/

	$( "#opener" ).click(function() {
		$( "#dialog" ).dialog( "open" );
	});

	var toggleAdvanced = false;
	// Sortable Elements
	$( "#sortable-anim" ).sortable();
    $( "#sortable-anim" ).disableSelection();
    $( "#sortable-sens" ).sortable();
	$( "#sortable-sens" ).disableSelection();


    //cf MisGUI  $("button.start-rec").bind("click", UIstartRec);

    $("button.play").bind("click", UIplayAnim);
    $("button.stop").bind("click", UIstopAnim);
    $("button.loop").bind("click", UIloopAnim);


    $("button.advanced").bind("click", function(){
		misGUI.toggleAdvanced(toggleAdvanced);

    	if(toggleAdvanced){
    		UIhideAdvanced();
    	}else{
    		UIshowAdvanced();
    	}
    })


	function UIstartRec(){

		console.log("UIstartrecording");


		$("button.start-rec").css({
			'border': '2px solid rgba(255, 24, 98, 1)'
		});

		$("button.start-rec").html("stop recording")

		$("button.start-rec").css({
			'animation-duration': '1s'
		});


		$(".switch").css({
			'opacity': '0.3'
		});

	    $(".switch input").attr("disabled", true);

		//cf MisGUI $("button.start-rec").unbind("click", UIstartRec);
		//cf MisGUI $("button.start-rec").bind("click", UIstoprecording);

	}


	function UIstoprecording(){

		//console.log("DBG-UIstoprecording");

		$("button.start-rec").css({
			'border': '0px solid rgba(255, 24, 98, 1)'
		});

		$("button.start-rec").html("start recording")

		$("button.start-rec").css({
			'animation-duration': '0s'
		});


		$(".switch").css({
			'opacity': '1'
		});

	    $(".switch input").attr("disabled", false);

		//cf MisGUI $("button.start-rec").bind("click", UIstartRec);
		//cf MisGUI $("button.start-rec").unbind("click", UIstoprecording);
	}


	  
	  function UIshowAdvanced(){
	  	
	  	$(".allMotors").hide("slide", 1, function(){
	  		console.log("finish");
	  		$(".motors-settings").show("slide");
	  		$("button.advanced").html("ok");
	  		$("button.advanced").addClass("valid");
	  		$(".motors-btn-group").find(".hide").show();
	  		$(".motors-btn-group").find(".show").hide();
	  	});
	  	toggleAdvanced = true;
	  }


	  function UIhideAdvanced(){
	  	$(".motors-settings").hide("slide", 1, function(){
	  		console.log("finish");
	  		$(".allMotors").show("slide");
	  		$("button.advanced").removeClass("valid");
	  		$("button.advanced").html("<img src='assets/settings.png'>");
	  		$(".motors-btn-group").find(".hide").hide();
	  		$(".motors-btn-group").find(".show").show();

	  	});
	  	toggleAdvanced = false;
	  	
	  }


	  function UIplayAnim(witch){
		  if(witch==undefined)witch=this;
		  $(witch).parent().next(".progress").addClass('active');
		  $(witch).css("opacity", 1);
	  }

	  function UIloopAnim(witch,onoff){
	  	if(witch==undefined)witch=this;
	  	if(onoff==undefined)onoff=($(witch).css("opacity")!=1);
	  	if(onoff){
	  		$(witch).css("opacity", 1);
	  	}else{
			$(witch).css("opacity", 0.6);
	  	}
	  	return onoff;
	  }

	  function UIstopAnim(witch){
		  if(witch==undefined)witch=this;
	  	$(witch).prev(".play").css("opacity", 0.6);
	  	//NOOON $(witch).next(".loop").css("opacity", 0.6);
	  	$(witch).parent().next(".progress").removeClass('active');
	  }

	
	// function fakeSensor(){
	// 	var maxValue = 100;
	// 	var val = Math.random()*maxValue;
	// 	console.log(val);
	// 	$(".live-value").html(Math.round(val)+"%");
	// 	$(".live-value-ui").css("left", val+"%");
	// 	return val;
	// }

	// function timer(){
	// 	varTimer = setInterval(fakeSensor, 3000);
	// }

	// timer();



// });