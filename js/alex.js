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