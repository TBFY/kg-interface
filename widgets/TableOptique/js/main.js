var query = "";
var opT = [{
	"name" : "echo",
	"parameters" : []
}, {
	"name" : "moninc",
	"parameters" : []
}, {
	"name" : "range",
	"parameters" : [{
		"name" : "min",
		"value" : 0
	}, {
		"name" : "max",
		"value" : 100
	}]
}, {
	"name" : "gradientcheck",
	"parameters" : [{
		"name" : "rise",
		"value" : 5
	}]
}, {
	"name" : "loggingfault",
	"parameters" : []
}]

$(document).ready(function() {
	//cache false
	$.ajaxSetup({
		cache : false
	});

	Table = new table();
	if (!$('#resultPage').length) {
		Table.createMainPage();
	}

	// neutral to active
	$('body').on('click', '#op_update_request', function(event) {
		var id = $(this).attr("op") + $(this).attr("par");
		$("#" + id).removeClass('active');
		$("#" + id).addClass('neutral');
		$("#" + id).trigger("click");
	});

	// neutral to active
	$('body').on('click', '.neutral, .active', function(event) {
		var mss = new Object();
		mss.opType = $(this).attr("opType");
		mss.op = $(this).attr("op");
		mss.st = $(this).attr("class");
		deliverEvent($(this).attr("vid"), mss);
	});

	// go to resource
	$('body').on('click', '.resource', function(event) {
		var repository = getRepository();
		//redirect
		var url = config.resourceBase+"?uri=" + encodeURIComponent($(this).attr("rs"));
		window.open(url, '_blank');
	});

	// run query
	$('body').on('click', '#runIWB', function(event) {
		//extract repository paramater and forward it to iwb
		var repository = getRepository();
		//redirect
		if (repository != "RDF") {
			var url = config.externalBase + "?infer=true&sameAs=true&query=" + encodeURIComponent(query);
			window.open(url, '_blank');
		} else {
			var url = config.externalBase + "?infer=true&sameAs=true&query=" + encodeURIComponent(query);
			window.open(url, '_blank');
		}
	});

	$('body').on('click', '#runIWBT', function(event) {
		dataModel.registerTQuery();
	});

});

function table() {
	this.fillTable = fillTable;
	this.fillTTable = fillTTable;
	this.createMainPage = createMainPage;
	this.deliverEvent = deliverEvent;
	this.sortHeaders = sortHeaders;
	this.sortTHeaders = sortTHeaders;
	this.isNumeric = isNumeric;

}

function createMainPage() {
	var content;

	//prepare the page
	content = '<div data-role="page" id="resultPage">';
	content += '<div data-role="header" data-id="tableHeader" data-position="fixed" data-tap-toggle="false">';
	content += '<h1>Example Results</h1>';
	content += '</div>';
	content += '</div>';
	content = $(content);

	//append it to the page container
	content.appendTo($.mobile.pageContainer);

	//go to it
	$.mobile.changePage("#resultPage", {
		transition : 'flip'
	});

}

//set icons at table headers
function sortHeaders(sq, ag) {
	if (!jQuery.isEmptyObject(sq)) {
		if (sq.op == "sortdown") {
			$("#sortdown" + sq.vr).removeClass('neutral');
			$("#sortdown" + sq.vr).addClass('active');
			$("#" + sq.vr).html("SORT_DOWN " + $("#" + sq.vr).text());
		} else if (sq.op == "sortup") {
			$("#sortup" + sq.vr).removeClass('neutral');
			$("#sortup" + sq.vr).addClass('active');
			$("#" + sq.vr).html("SORT_UP " + $("#" + sq.vr).text());
		}
	}

	if (!jQuery.isEmptyObject(ag)) {
		if (ag.op == "count") {
			$("#count" + ag.vra).removeClass('neutral');
			$("#count" + ag.vra).addClass('active');
		} else if (ag.op == "sum") {
			$("#sum" + ag.vra).removeClass('neutral');
			$("#sum" + ag.vra).addClass('active');
		} else if (ag.op == "avg") {
			$("#avg" + ag.vra).removeClass('neutral');
			$("#avg" + ag.vra).addClass('active');
		} else if (ag.op == "max") {
			$("#max" + ag.vra).removeClass('neutral');
			$("#max" + ag.vra).addClass('active');
		} else if (ag.op == "min") {
			$("#min" + ag.vra).removeClass('neutral');
			$("#min" + ag.vra).addClass('active');
		}
	}

	$(".ui-table-columntoggle-popup").find(".ui-btn-text").each(function() {
		var txt = $(this).text().replace('SumAvgMaxMinCountS.UpS.Down', '');
		$(this).text(txt);

	});

}

//set icons at table headers for stream
function sortTHeaders(st) {
	if (!jQuery.isEmptyObject(st)) {
		$("#" + st.op + st.vr).removeClass('neutral');
		$("#" + st.op + st.vr).addClass('active');
		$("#" + st.vr).html(st.op.toUpperCase() + " " + $("#" + st.vr).text());
	}

	$(".ui-table-columntoggle-popup").find(".ui-btn-text").each(function() {
		var txt = $(this).text().replace('EchoMonInc', '');
		$(this).text(txt);

	});

}

function fillTable(data, dt) {
	var content;
	var vr = dt.content;
	$("#resultPage").empty();

	//prepare the page
	content = '<div data-role="header" data-id="tableHeader" data-position="fixed" data-tap-toggle="false">';
	content += '<h1>Example Results</h1>';
	content += '</div>';
	content += '<div data-role="content" id="content">';

	//prepare the table
	content += '<div data-role="content" id="contentResult" style="min-height: 300px;">';
	content += '<a href="#" id="runIWB" data-role="button" data-inline="true" data-mini="true" data-theme="d">Full result set</a>';
	content += '<table data-role="table" id="tableResult" data-mode="columntoggle" class="ui-body-d ui-shadow table-stripe ui-responsive" data-column-btn-theme="d" data-column-btn-text="Columns to display..." data-column-popup-theme="d">';
	content += '<thead>';
	content += '<tr id="headResult" class="ui-bar-d">';

	//prepare table heading
	for (var i = 0; i < vr.output.length; i++) {
		if(vr.output[i].typ != 'label'){
			var htext = "";
			var hvid = vr.output[i].id;

			if (vr.output[i].id == vr.aggregate.vr) {
				htext = (vr.longids == 'no' ? vr.aggregate.vra : vr.aggregate.vrha);
				hvid = vr.aggregate.vra;
			} else {
				htext = (vr.longids == 'no' ? vr.output[i].id : vr.output[i].hId);
			}

			content += '<th data-priority="' + (i < 6 ? i + 1 : 6) + '">';
			content += '<div id=' + hvid + ' style="float:left;">' + htext + '</div>';
			content += '<div id="tblOps">';
			content += '<div class="wrapper">';
			content += '<div class="content">';
			content += '<ul>';
			// Aggregation operations: disabled
			/*if (isNumeric(vr.output[i].typ)) {
				content += '<a href="#"><li vid="' + hvid + '" id="sum' + hvid + '" op="sum" opType="aggregate" class="neutral">Sum</li></a>';
				content += '<a href="#"><li vid="' + hvid + '" id="avg' + hvid + '" op="avg" opType="aggregate" class="neutral">Avg</li></a>';
				content += '<a href="#"><li vid="' + hvid + '" id="max' + hvid + '" op="max" opType="aggregate" class="neutral">Max</li></a>';
				content += '<a href="#"><li vid="' + hvid + '" id="min' + hvid + '" op="min" opType="aggregate" class="neutral">Min</li></a>';
				//content += '<a href="#"><li id="s' + vr[i].id + '" class="sum_neutral">Sum</li></a>';
				//content += '<a href="#"><li id="a' + vr[i].id + '" class="avg_neutral">Avg</li></a>';
				//content += '<a href="#"><li id="x' + vr[i].id + '" class="max_neutral">Max</li></a>';
				//content += '<a href="#"><li id="n' + vr[i].id + '" class="min_neutral">Min</li></a>';
			} else {
				content += '<a href="#"><li class="op_neutral"><del>Sum</del></li></a>';
				content += '<a href="#"><li class="op_neutral"><del>Avg</del></li></a>';
				content += '<a href="#"><li class="op_neutral"><del>Max</del></li></a>';
				content += '<a href="#"><li class="op_neutral"><del>Min</del></li></a>';
			}*/
			//content += '<a href="#"><li vid="' + hvid + '" id="count' + hvid + '" op="count" opType="aggregate" class="neutral">Count</li></a>';
			//content += '<a href="#"><li vid="' + hvid + '" id="sortup' + hvid + '" op="sortup" opType="sequence" class="neutral">S.Up</li></a>';
			//content += '<a href="#"><li vid="' + hvid + '" id="sortdown' + hvid + '" op="sortdown" opType="sequence" class="neutral">S.Down</li></a>';
			//content += '<a href="#"><li id="c' + vr[i].id + '" class="count_neutral">Count</li></a>';
			//content += '<a href="#"><li id="u' + vr[i].id + '" class="sortup_neutral">S.Up</li></a>';
			//content += '<a href="#"><li id="d' + vr[i].id + '" class="sortdown_neutral">S.Down</li></a>';
			//content += '</ul></div>';
			content += '</div></div>';
			//content += '<div id="s' + data.head.vars[i] + '" class="sort_neutral"></div>'
			content += '</th>';
		}
	}
	content += '</tr>';
	content += '<tbody>';

	//prepare result list
	//data.results.bindings.length
	if (data != "") {
		for (var i = 0; i < data.results.bindings.length; i++) {
			content += '<tr>';
			var indx = 0;
			for (var y in data.head.vars) {
				if(vr.output[indx].typ != "label"){
					var key = data.head.vars[y];
					if ( typeof data.results.bindings[i][key] !== 'undefined') {
						if (vr.output[indx].typ != "concept" || vr.output[indx].id == vr.aggregate.vr){
							content += '<th>' + data.results.bindings[i][key].value + '</th>';
						} else {
							var rtxt = "Go to resource";
							if(data.results.bindings[i][key+"_label"] !== undefined)
								rtxt =  data.results.bindings[i][key+"_label"].value;
							else if (data.results.bindings[i][key+"_l"] !== undefined)
								rtxt =  data.results.bindings[i][key+"_l"].value;
							content += '<th><a href="#" rs="' + data.results.bindings[i][key].value + '" class="resource">'+ rtxt +'</a></th>';
						}
					} else {
						content += '<th> - </th>';
					}
				}
				indx++;
			}
			content += '</tr>';
		}
	}
	content += '</tbody>';
	content += '</table>';
	content += '</div>';
	content = $(content);

	content.appendTo("#resultPage");
	$("#resultPage").page().trigger("pagecreate");
	Table.sortHeaders(dt.content.sequence, dt.content.aggregate);
}

function fillTTable(dt) {
	var content;
	var vr = dt.content;

	$("#resultPage").empty();

	//prepare the page
	content = '<div data-role="header" data-id="tableHeader" data-position="fixed" data-tap-toggle="false">';
	content += '<h1>Example Results</h1>';
	content += '</div>';
	content += '<div data-role="content" id="content">';

	//prepare the table
	content += '<div data-role="content" id="contentResult" style="min-height: 300px;">';
	content += '<a href="#" id="runIWBT" data-role="button" data-inline="true" data-mini="true" data-theme="d" ' + ( typeof dt.content.streamop.op === "undefined" ? 'class="ui-disabled"' : '') + '>Register query</a>';
	content += '<table data-role="table" id="tableResult" data-mode="columntoggle" class="ui-body-d ui-shadow table-stripe ui-responsive" data-column-btn-theme="d" data-column-btn-text="Columns to display..." data-column-popup-theme="d">';
	content += '<thead>';
	content += '<tr id="headResult" class="ui-bar-d">';
	//prepare table heading
	for (var i = 0; i < vr.output.length; i++) {
		content += '<th data-priority="' + (i < 5 ? i + 1 : 5) + '">';
		content += '<div id=' + vr.output[i].id + ' style="float:left;' + (vr.output[i].annt == "stream" ? 'color:blue' : '') + '">' + (vr.longids == 'no' ? vr.output[i].id : vr.output[i].hId) + '</div>';

		if (vr.output[i].annt == "stream") {
			content += '<div id="tblOps">';
			content += '<div class="wrapper">';
			content += '<div class="content">';
			content += '<ul>';

			for (var y = 0; y < opT.length; y++) {
				content += '<a href="#"><li vid="' + vr.output[i].id + '" id="' + opT[y].name + vr.output[i].id + '" op="' + opT[y].name + '" opType="stream_op" class="neutral">' + opT[y].name + '</li></a>';
				//content += '<a href="#"><li vid="' + vr.output[i].id + '" id="moninc_' + vr.output[i].id + '" op="moninc" opType="stream_op" class="neutral">MonInc</li></a>';
			}

			content += '</ul></div>';
		}

		content += '</div></div>';
		content += '</th>';
	}
	content += '</tr>';
	content += '<tbody>';
	//prepare result list

	if ( typeof dt.content.streamop.op !== "undefined") {

		var op = jQuery.grep(opT, function(o) {
			return o.name == dt.content.streamop.op;
		});

		for ( i = 0; i <= op[0].parameters.length; i++) {
			content += '<tr>';
			for (var y = 0; y < vr.output.length; y++) {
				if (vr.output[y].id != dt.content.streamop.vr) {
					content += '<th> - </th>';
				} else {
					if (op[0].parameters.length != i) {
						content += '<th><label for="' + op[0].parameters[i].name + '">' + op[0].parameters[i].name + '</label>';
						content += '<input type="number" data-clear-btn="true" name="' + op[0].parameters[i].name + '" id="' + dt.content.streamop.op + '_' + op[0].parameters[i].name + '" value="' + dt.content.streamop.params[i].value + '">';
						content += '</th>';
					} else if (op[0].parameters.length > 0) {
						content += '<th><input type="submit" id="op_update_request" op="' + dt.content.streamop.op + '" par="' + vr.output[y].id + '" value="Update"></th>';
					}
				}
			}
			content += '</tr>';
		}
	}

	content += '</tbody>';
	content += '</table>';
	content += '</div>';
	content = $(content);

	content.appendTo("#resultPage");
	$("#resultPage").page().trigger("pagecreate");
	Table.sortTHeaders(dt.content.streamop);
}

function isNumeric(typ) {
	var n = ["integer", "double", "float", "decimal", "int", "long", "short"];
	if (n.indexOf(typ.toLowerCase()) != -1)
		return 1;
	return 0;
}

function deliverEvent(Id, mss) {
	Channel.ClearMessage();
	Channel.message.content = new Object();

	Channel.message.type = mss.opType;
	if (mss.st == "neutral") {
		Channel.message.content.op = mss.op;
		Channel.message.content.vr = Id;

		// for the stream
		var op = jQuery.grep(opT, function(o) {
			return o.name == mss.op;
		});

		if (op.length > 0) {
			Channel.message.content.params = op[0].parameters;
			for (var i = 0; i < op[0].parameters.length; i++) {
				if ($('#' + mss.op + '_' + op[0].parameters[i].name).length > 0)
					Channel.message.content.params[i].value = $('#' + mss.op + '_' + op[0].parameters[i].name).val();
			}
		}
		// end of for streams

	} else {
		Channel.message.content = {};
	}
	Channel.Send('parent');
}
