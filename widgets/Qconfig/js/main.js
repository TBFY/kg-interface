$(document).ready(function() {
	//cache false
	$.ajaxSetup({
		cache : false
	});

	qconfig = new Qconfig();

	//call OptiqueVQS
	$('body').on('click', '#submit', function(event) {
		Channel.ClearMessage();
		Channel.message.type = 'Qconfig';
		Channel.message.content = new Object();
		Channel.message.content.distinct = $("#distinct").val();
		Channel.message.content.example = $("#example").val();
		Channel.message.content.longids = $("#longids").val();
		Channel.message.content.longidsv = $("#longidsv").val();
		Channel.message.content.limit = $("#limit").val();
		Channel.Send("parent");

	});

});

function Qconfig() {
	this.setValues = setValues;
}

function setValues(dt) {
	$("#example").val(dt.content.example);
	$("#example").selectmenu('refresh');
	$("#longids").val(dt.content.longids);
	$("#longids").selectmenu('refresh');
	$("#longidsv").val(dt.content.longidsv);
	$("#longidsv").selectmenu('refresh');
	$("#distinct").val(dt.content.distinct);
	$("#distinct").selectmenu('refresh');
	$("#limit").val(dt.content.limit);
}
