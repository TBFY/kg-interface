// a temproray fix for the initinally
// hidden Table iframe - if set to 1 that means
// iframe is already loaded, no need to change the src
var tmp = 0;

$(document).ready(function() {
	//cache false
	$.ajaxSetup({
		cache : false
	});

	$('body').on('click', '#approve', function(event) {
		Channel.ClearMessage();
		Channel.message.type = $("#confirm_mss").attr('bck');
		Channel.message.content = new Object();
		Channel.Send('Graph');
		$("#popupDialog").popup("close");
	});

	$('body').on('click', '#cancel', function(event) {
		$("#popupDialog").popup("close");
	});

	// hide result view
	$('#bottom_res').hide();
	// update height
	$("#main").height($(window).height());
	// auto adjust the height
	window.onresize = function(event) {
		$("#main").height($(window).height());
	}
});

function confirm(mss, bck) {
	$("#confirm_mss").text(mss);
	$("#confirm_mss").attr("bck", bck);
	$("#popupDialog").popup("open");
}

function callWidget(dt) {
	$("#popupWidget").popup("open");
	// Fix here later!
	if (dt.type == "geoLocation")
		$('#widget').attr('src', 'http://folk.uio.no/martige/what/20140813/dummy/widgets/geoLocation/index.html');
	else if (dt.type == "Qconfig")
		$('#widget').attr('src', 'widgets/' + dt.type + '/index.html');
	else
		$('#widget').attr('src', 'widgets/' + dt.type + '/index.html');
	Channel.ClearMessage();
	Channel.message = dt;
	//later:widget notifies when it is loaded
	setTimeout(function() {
		Channel.Send('widget')
	}, 1000);
}

function inform(mss) {
	var options = new Object();
	options.x = 0;
	options.y = 0;

	$("#popupInfo").html("<p>" + mss + "</p>");
	$("#popupInfo").popup("open", options);
}

function activateComp(part, query) {
	if (part == 'result') {

		$('#bottom_qf').hide();
		$('#bottom_res').show();

		$('#Table').attr('src', 'widgets/TableOptique/index.html');

	} else {
		$('#bottom_qf').show();
		$('#bottom_res').hide();
	}
}

//extract url parameters
function getURLParameter(url, name) {
	return (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1];
}

//find the base url
function getBaseUrl() {
	var base;

	if (getURLParameter($(location).attr('href'), "base") != null) {
		base = getURLParameter($(location).attr('href'), "base");
	} else {

		if (window.location.protocol == 'http:' || window.location.protocol == 'https:')
			base = window.location.protocol + "//" + window.location.host;
		else
			base = window.location.host;
	}

	return base;
}
