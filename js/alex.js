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
	
	 
	$( "#sortable-sens" ).sortable({
		stop: function( event, ui ) {
			console.log("sortable-sens stop");
		}
	  });
	$( "#sortable-sens" ).disableSelection();
	// $( "#sortable-sens-output" ).sortable();
	
	// take it now for now, because it is not working
	  
	// $( "#sortable-sens-output" ).sortable({
	// 	start: function(event, ui){
	// 		console.log("sortable-sens-output::start!!!");
	// 	},
	// 	stop: function( event, ui ) {
	// 		console.log("sortable-sens-output:stop!!!");
	// 	},
	//   });
	  


    //cf MisGUI  $("button.start-rec").bind("click", UIstartRec);

    $("button.play").bind("click", UIplayAnim);
    $("button.stop").bind("click", UIstopAnim);
    //$("button.loop").bind("click", UIloopAnim); //DB: GRRR see UIloopAnim:ERROR


   


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


	


	  function UIplayAnim(witch){
		  if(witch==undefined)witch=this;
		  $(witch).parent().next(".progress").addClass('active');
		  $(witch).css("opacity", 1);
	  	  $(witch).html('<img src="assets/play-green.png" alt="" name="loop">');

	  }

	  function UIloopAnim(witch,onoff){
		console.log("UIloopAnim1:",onoff);
		if(witch==undefined){witch=this;console.log("UIloopAnim1b:undef");}
		try{if(onoff==undefined)onoff=($(witch).css("opacity")!=1); //DB: GRRR Cannot read property 'defaultView' of undefined 
		}catch(e){console.log("*** LOOP ERROR ***");onoff=true;} //DB: resolved by removing
	  	if(onoff){
	  		$(witch).css("opacity", 1);
			$(witch).html('<img src="assets/loop-green.png" alt="" name="loop">');
	  	}else{
			$(witch).css("opacity", 0.6);
			$(witch).html('<img src="assets/loop.png" alt="" name="loop">');
		}
		console.log("UIloopAnim2:",onoff); //witch.css("opacity"));
	  	return onoff;
	  }

	  function UIstopAnim(witch){
		if(witch==undefined)witch=this;
	  	$(witch).prev(".play").css("opacity", 0.6);
	  	$(witch).prev(".play").html('<img src="assets/play.png" alt="" name="loop">');

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