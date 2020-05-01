// delete node mode on/off
var deleteNode = false;
// same node on/off
var sameNode = false;
// same node head
var nodeSame = '';
// node to delete
var nodeToDelete = '';
// query title
//var queryTitle;
//opentab
var openTab = 'savedQueries';
// active node
var activeNode;
//current query
var query = new Object();
//sparql view
var sparqlv;
//config
var Qconfig = new Object();
Qconfig.distinct = 'yes';
Qconfig.example = 'yes';
Qconfig.longids = 'yes';
Qconfig.longidsv = 'no';
Qconfig.limit = 10;

// A Starql template has two functions: one for constructing select
// clauses and one for constructing having clauses.  Both take four
// arguments: the subject and predicate used in the query, a
// guaranteed unique integer for creating uids if necessary, and an
// array of parameter objects of the form { 'name' : string, 'value' :
// value }.  See http://optique.fluidops.net/resource/StreamVQS and
// widgets/TableOptique/js/main.js
var StarqlTemplate = function(name, selectFunction, havingFunction) {
	this.name = name;
	this.getSelectClause = selectFunction;
	this.getHavingClause = havingFunction;
}
// The echo template just emits the value that exists at each time
// point.
var StarqlEchoTemplate = new StarqlTemplate("Echo", function(subj, pred, uniqueid, params) {
	return "?_val" + uniqueid;
}, function(subj, pred, uniqueid, params) {
	return "EXISTS i IN seq ( GRAPH i { " + subj + " " + pred + " ?_val" + uniqueid + " } )";
});

// The monotonic increase template emits a value if it has been
// monotonically increasing over the interval.
var StarqlMonIncTemplate = new StarqlTemplate("Monotonic Increase", function(subj, pred, uniqueid, params) {
	return subj;
}, function(subj, pred, uniqueid, params) {
	return "FORALL i, j IN seq ?x, ?y (\n" + "IF i < j AND GRAPH i { " + subj + " " + pred + " ?x }\n" + "    AND GRAPH j { " + subj + " " + pred + " ?y } THEN ?x <= ?y)";
});

var StarqlRangeTemplate = new StarqlTemplate("Range", function(subj, pred, uniqueid, params) {
	return "?_val" + uniqueid;
}, function(subj, pred, uniqueid, params) {
	var min;
	var max;
	for (var i = 0; i < params.length; i++) {
		if (params[i].name == "min")
			min = params[i].value;
		if (params[i].name == "max")
			max = params[i].value;
	}
	return "FORALL i IN seq ?_val" + uniqueid + " (\n" + "  GRAPH i { " + subj + " " + pred + " ?_val" + uniqueid + " }\n" + "  AND ?_val" + uniqueid + " > " + min + " AND ?_val" + uniqueid + " < " + max + " )";
});

var StarqlGradientCheckTemplate = new StarqlTemplate("gradientcheck", function(subj, pred, uniqueid, params) {
	return "?_val" + uniqueid;
}, function(subj, pred, uniqueid, params) {
	var rise;
	for (var i = 0; i < params.length; i++) {
		if (params[i].name == "rise")
			rise = params[i].value;
	}
	return "FORALL i, j IN seq ?_val" + uniqueid + ", ?y (\n" + "  IF GRAPH i { " + subj + " " + pred + " ?_val" + uniqueid + " }\n" + "    AND GRAPH j { " + subj + " " + pred + " ?y } \n" + "    AND i + 1 = j\n" + "  THEN ?_val" + uniqueid + " - ?y > " + rise + ")";
});

var StarqlLoggingFaultTemplate = new StarqlTemplate("loggingfault", function(subj, pred, uniqueid, params) {
	return subj;
}, function(subj, pred, uniqueid, params) {
	return "EXISTS i, j IN seq ?_val" + uniqueid + ", ?y (\n" + "  GRAPH i { " + subj + " " + pred + " ?_val" + uniqueid + " }\n" + "  AND GRAPH j { " + subj + " " + pred + " ?y } \n" + "  AND i != j)\n";
});

// experiment stuff
// load date
var x;
// run date
var y;
// version
var v;
// exp?
var exp;

(function() {
	var ua = navigator.userAgent, iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i), typeOfCanvas = typeof HTMLCanvasElement, nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'), textSupport = nativeCanvasSupport && ( typeof document.createElement('canvas').getContext('2d').fillText == 'function');
	//I'm setting this based on the fact that ExCanvas provides text support for IE
	//and that as of today iPhone/iPad current text support is lame
	labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native' : 'HTML';
	nativeTextSupport = labelType == 'Native';
	useGradients = nativeCanvasSupport;
	animate = !(iStuff || !nativeCanvasSupport);
})();

$(document).ready(function() {
	//cache false
	$.ajaxSetup({
		cache : false
	});

	tree = new myTree();
	$('#sparqlquery').hide();

	// define a non case-sensitive containts function
	jQuery.expr[':'].Contains = function(a, i, m) {
		return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
	};

	// hide tiny config buttons
	hideTinies();

	// activate temporal
	//call temporal widget
	$('body').on('click', '#tny_temp', function(event) {
		tree.deliverEvent('', 'temporal');
	});

	//call Q-Config
	$('body').on('click', '#Qconfig', function(event) {
		tree.deliverEvent('', 'Qconfig');
	});

	// experiment stuff
	exp = getURLParameter($(parent.location).attr('href'), "exp");
	if (exp == "true") {
		$('#newQuery').addClass('ui-disabled');
		$('#saveQuery').addClass('ui-disabled');
		$('#allQueries').addClass('ui-disabled');
		$('#draftQueries').addClass('ui-disabled');
		$("#executeQuery").addClass('ui-disabled');
	}

	// activate/deactivate delete node function
	$('body').on('click', '#deleteNode', function(event) {
		if ($(this).hasClass('ui-btn-active')) {
			$('#deleteNode').removeClass('ui-btn-active');
			$('body').css('cursor', 'default');
			$('.node').css('cursor', 'pointer');
			$('.textnode').css('cursor', 'pointer');
			deleteNode = false;
		} else {
			if (sameNode)
				$('#sameNode').trigger('click');
			$('#deleteNode').addClass('ui-btn-active');
			$('body').css('cursor', 'crosshair');
			$('.node').css('cursor', 'crosshair');
			$('.textnode').css('cursor', 'crosshair');

			deleteNode = true;
		}
	});
	// activate/deactivate same node function
	$('body').on('click', '#sameNode', function(event) {
		if ($(this).hasClass('ui-btn-active')) {
			$('#sameNode').removeClass('ui-btn-active');
			$('body').css('cursor', 'default');
			$('.node').css('cursor', 'pointer');
			$('.textnode').css('cursor', 'pointer');
			sameNode = false;
		} else {
			if (deleteNode)
				$('#deleteNode').trigger('click');
			$('#sameNode').addClass('ui-btn-active');
			$('body').css('cursor', 'crosshair');
			$('.node').css('cursor', 'crosshair');
			$('.textnode').css('cursor', 'crosshair');
			sameNode = true;
		}
	});
	//save query
	$('body').on('click', '#saveQuery', function(event) {
		var type;
		var qe;

		if (isStream() >= 0){
			type = "starql";
			qe = tree.getStarql(tree.toSparqlObj());
		} else {
			type = "sparql";
			qe = tree.getSparql(tree.toSparqlObj());
		}

		if ( typeof query.id === "undefined") {
			dataModel.saveQuery(tree.getAttr(0, "label"), tree.getAttr(0, "desc"), qe, JSON.stringify(tree.getQueryGraph()), "final", type);
		} else {
			dataModel.updateQuery(query.id, tree.getAttr(0, "label"), tree.getAttr(0, "desc"), qe, JSON.stringify(tree.getQueryGraph()), "final", type);
			if ( typeof query.dId !== "undefined")
				dataModel.deleteQuery(query.dId);
		}
		tree.deliverEvent("Query saved!", "info");
	});

	//activate/deactivate sparql view
	$('body').on('click', '#sparql', function(event) {
		if ($(this).hasClass('ui-btn-active')) {
			$('#deleteNode').removeClass('ui-disabled');
			$('#sparql').removeClass('ui-btn-active');
			$('#sparqlquery').hide();
			$('#infovis').show();
			showTinies();
		} else {
			$('#sparql').addClass('ui-btn-active');
			$('#infovis').hide();
			$('#sparqlquery').show();
			hideTinies();
	}

	$("#queryarea").html(tree.getSparqlView());

	});
	// activate/deactivate execute query
	$('body').on('click', '#executeQuery', function(event) {
		if ($(this).hasClass('ui-btn-active')) {
			// revert this later
			$('#executeQuery').removeClass('ui-btn-active');
			// revert this later
			$('#deleteNode').removeClass('ui-disabled');
			tree.deliverEvent('', 'resultViewComplete');
		} else {
			//if empty query do not execute
			if (!tree.isLeaf(0)) {

				// experiment stuff
				if (exp == "true") {
					var type;
					if (isStream() >= 0)
						type = "starql";
					else
						type = "sparql";
					y = new Date();
					var time = (y.getTime() - x.getTime()) / 1000;
					v = v + 1;
					dataModel.saveQuery(tree.getAttr(0, "label") + "(" + v + ")", time + " seconds on " + y, tree.getSparql(tree.toSparqlObj()), JSON.stringify(tree.getQueryGraph()), "draft", type);
					x = new Date();

					$("#executeQuery .ui-btn-text").text("Run Query (" + (3 - v) + ")");

					if (v == 3)
						$('#executeQuery').addClass('ui-disabled');

				}

				$('#executeQuery').addClass('ui-btn-active');
				tree.deliverEvent('', 'executeQuery');

			}
		}
	});
	//node click :: delete and same
	$('body').on('click', '.node', function(event) {
		if (deleteNode) {
			confirmDelete(this.id);
			$('#deleteNode').trigger("click");
		} else if (sameNode && this.id != 0) {
			if (nodeSame == '') {
				nodeSame = this.id;
				// TODO: change color here
			} else {
				tree.addSame(nodeSame, this.id);
				nodeSame = '';
				$('#sameNode').trigger("click");
			}
		}
	});
	//node onmouseover :: delete and same
	$('body').on('mouseover', '.node', function(event) {
		var color;

		if (deleteNode)
			color = "#FF0000";
		else if (sameNode)
			color = "#9ACD32";
		if ( typeof color !== "undefined")
			tree.changeLabelColor(this.id, color);
	});
	//node onmouseout :: delete and same
	$('body').on('mouseout', '.node', function(event) {
		var color = "#FFFFFF";

		if (activeNode == this.id)
			color = "#FF9900";

		tree.changeLabelColor(this.id, color);
	});
	//edit node label
	$('body').on('input', '.eNodeLabel', function(event) {
		changeTitle($(this).text());
		tree.updateAttr(0, "label", $(this).text());
	});
	//edit node desc
	$('body').on('input', '.eNodeDesc', function(event) {
		tree.updateAttr(0, "desc", $(this).text());
	});
	//text node click :: delete, change etc.
	$('body').on('click', '.textNode', function(event) {
		if (deleteNode) {
			confirmDelete(this.getAttribute("txt_id"));
			$('#deleteNode').trigger("click");
		} else {
			tree.changeActiveNode(this.getAttribute("txt_id"), 'nodeSelected', 'stack');
		}
	});
	//open load query panel
	$('body').on('click', '#storedQueries', function(event) {
		dataModel.getQueries();
		$("#queryPanel").panel("open");
	});
	//undo
	$('body').on('click', '#undo', function(event) {
		var cmd = stack.undo();

		if (cmd.type == 'nodeAdded') {
			tree.removeNode(cmd.content.id, 'noStack')
		} else if (cmd.type == 'nodesRemoved') {
			for (var i = 0; i < cmd.content.dt.length; i++) {
				if (cmd.content.activeNode == cmd.content.dt[i].id)
					tree.addNode(cmd.content.dt[i].pid, cmd.content.dt[i].data, 'noStack', 'active')
				else
					tree.addNode(cmd.content.dt[i].pid, cmd.content.dt[i].data, 'noStack', 'notActive')
				if (cmd.content.dt[i].seq !== undefined)
					tree.quence(cmd.content.dt[i].seq, 'noStack');
				if (cmd.content.dt[i].agg !== undefined)
					tree.updateAggregate(cmd.content.dt[i].agg, 'noStack');
				if (cmd.content.dt[i].stOp !== undefined)
					tree.updateStreamOp(cmd.content.dt[i].stOp, 'noStack');
			}
		} else if (cmd.type == 'attributeAdded') {
			tree.removeAttr(cmd.content, 'noStack');
			tree.changeActiveNode(activeNode, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'attributeRemoved') {
			tree.addAttr(cmd.content.attr, 'noStack');
			if (cmd.content.seq !== undefined)
				tree.updateSequence(cmd.content.seq, 'noStack');
			if (cmd.content.agg !== undefined)
				tree.updateAggregate(cmd.content.agg, 'noStack');
			if (cmd.content.stOp !== undefined)
				tree.updateStreamOp(cmd.content.stOp, 'noStack');
			tree.changeActiveNode(activeNode, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'constraintAdded') {
			if ( typeof cmd.content.prev.id === 'undefined')
				tree.removeConstraint(cmd.content.curr, 'noStack');
			else
				tree.addConstraint(cmd.content.prev, 'noStack');
			tree.changeActiveNode(activeNode, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'constraintRemoved') {
			tree.addConstraint(cmd.content, 'noStack');
			tree.changeActiveNode(activeNode, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'activeNodeChanged') {
			tree.changeActiveNode(cmd.content.prev, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'sequenceUpdated') {
			tree.updateSequence(cmd.content.prev, 'noStack');
		} else if (cmd.type == 'aggregateUpdated') {
			tree.updateAggregate(cmd.content.agg.prev, 'noStack');
			if (!jQuery.isEmptyObject(cmd.content.seq))
				tree.updateSequence(cmd.content.seq.prev, 'noStack');
		} else if (cmd.type == 'streamOpUpdated') {
			tree.updateStreamOp(cmd.content.prev, 'noStack');
		}
	});
	//redo
	$('body').on('click', '#redo', function(event) {
		var cmd = stack.redo();

		if (cmd.type == 'nodeAdded') {
			tree.addNode(cmd.content.pid, cmd.content.data, 'noStack', 'active')
		} else if (cmd.type == 'nodesRemoved') {
			tree.removeNode(cmd.content.dt[0].id, 'noStack')
		} else if (cmd.type == 'attributeAdded') {
			tree.addAttr(cmd.content, 'noStack');
			tree.changeActiveNode(activeNode, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'attributeRemoved') {
			tree.removeAttr(cmd.content.attr, 'noStack');
			tree.changeActiveNode(activeNode, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'constraintAdded') {
			tree.addConstraint(cmd.content.curr, 'noStack');
			tree.changeActiveNode(activeNode, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'constraintRemoved') {
			tree.removeConstraint(cmd.content, 'noStack');
			tree.changeActiveNode(activeNode, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'activeNodeChanged') {
			tree.changeActiveNode(cmd.content.next, 'nodeSelected', 'noStack');
		} else if (cmd.type == 'sequenceUpdated') {
			tree.updateSequence(cmd.content.curr, 'noStack');
		} else if (cmd.type == 'aggregateUpdated') {
			tree.updateAggregate(cmd.content.agg.curr, 'noStack');
			if (!jQuery.isEmptyObject(cmd.content.seq))
				tree.updateSequence(cmd.content.seq.curr, 'noStack');
		} else if (cmd.type == 'streamOpUpdated') {
			tree.updateStreamOp(cmd.content.curr, 'noStack');
		}
	});
	//filter queries
	$('body').on('keyup', '#filterQueries', function(event) {
		filterQueries(openTab, $(this).val());
	});
	//delete query
	$('body').on('click', '.deleteQuery', function(event) {
		dataModel.deleteQuery($(this).attr("qId"));
		if (query.id == $(this).attr("qId")) {
			if ( typeof query.dId !== "undefined")
				dataModel.deleteQuery(query.dId);
			tree.loadQuery();
			tree.deliverEvent("Query deleted!", "info");
		}
	});
	//load query
	$('body').on('click', '.loadQuery', function(event) {
		dataModel.getQuery($(this).attr("qId"));
	});
	//new query
	$('body').on('click', '#newQuery', function(event) {
		tree.loadQuery();
		tree.deliverEvent("New query opened!", 'info');
	});
	//show draft queries only
	$('body').on('click', '#draftQueries', function(event) {
		filterQueries("draftQueries", $(".ui-input-text").val());
		openTab = 'draftQueries';
	});
	//show saved queries only
	$('body').on('click', '#savedQueries', function(event) {
		filterQueries("savedQueries", $(".ui-input-text").val());
		openTab = 'savedQueries';
	});
	//show all queries
	$('body').on('click', '#allQueries', function(event) {
		filterQueries("allQueries", $(".ui-input-text").val());
		openTab = 'allQueries';
	});
	//syncronize panels
	$("#queryPanel").panel({
		close : function(event, ui) {
			$("#queryToolbar").show("slow");
		},
		open : function(event, ui) {
			$("#queryToolbar").hide("slow");
		}
	});
});
// filter queries w.r.t tab and the keyword
function filterQueries(tab, text) {
	// hide all first
	$('#queryList > div').hide();

	// only show the relevant cat.
	if (tab == "savedQueries")
		$('#queryList > .final').show();
	else if (tab == "draftQueries")
		$('#queryList > .draft').show();
	else
		$('#queryList > div').show();

	// hide non-matching ones
	if (text != '')
		$('#queryList > div:not(:Contains(' + text + '))').hide();

	// refresh
	$("#queryList").collapsibleset('refresh');
}

// hide tiny buttons
function hideTinies() {
	$('#tny_mapp').closest('.ui-btn').hide();
	$('#tny_temp').closest('.ui-btn').hide();
}

// show tiny buttons
function showTinies() {
	// update tiny buttons
	var stream = isStream();
	var data = new Object();
	if (stream >= 0 && $("#infovis").is(":visible")) {
		$('#tny_temp').show('.ui-btn').show("slow");
		if ( typeof tree.getAttr(0, "temporal") == 'undefined') {
			data.slide = "1";
			data.slider = "s";
			data.window = "10";
			data.windowr = "s";
			data.start = "";
			data.end = "";
			tree.updateTimeWindow(data);
		}
	} else {
		$('#tny_temp').hide('.ui-btn').hide("slow");
		if ( typeof tree.getAttr(0, "temporal") !== 'undefined')
			tree.remAttr(0, "temporal");
	}
}

function isStream() {
	return JSON.stringify(tree.getQueryGraph()).indexOf("\"annt\":\"stream\"");
}

//save as draft: disabled
// need to use full version 
// of the OptiqueVQS
function saveDraft() {
	//if not saved yet
	//if ( typeof query.id === "undefined")
	//	dataModel.saveQuery(tree.getAttr(0, "label"), tree.getAttr(0, "desc"), tree.getSparql(tree.toSparqlObj()), JSON.stringify(tree.getQueryGraph()), "draft");
	//if a saved draft
	//else if (query.status == "draft")
	//	dataModel.updateQuery(query.id, tree.getAttr(0, "label"), tree.getAttr(0, "desc"), tree.getSparql(tree.toSparqlObj()), JSON.stringify(tree.getQueryGraph()), "draft");
	//save draft for a saved query
	//else if (query.status == "final")
	//console.log(query.status);
	//	dataModel.saveQuery(tree.getAttr(0, "label"), tree.getAttr(0, "desc"), tree.getSparql(tree.toSparqlObj()), JSON.stringify(tree.getQueryGraph()), "finalDraft");
	//update draft of a saved query
	//else if (query.status == "finalDraft")
	//	dataModel.updateQuery(query.dId, tree.getAttr(0, "label"), tree.getAttr(0, "desc"), tree.getSparql(tree.toSparqlObj()), JSON.stringify(tree.getQueryGraph()), "finalDraft");
}

//inform change
function informChange(reExec, saveDrft) {
	//save current query
	if (saveDrft == "saveDraft")
		saveDraft();

	//update view
	updateSparqlView();

	// show tiny buttons
	showTinies();

	//recolor for stream
	tree.stream_recolor();

	//reexecute if tabular view open
	if (reExec == "reExecuteQuery" && !tree.isLeaf(0))
		tree.deliverEvent('', 'reExecuteQuery');
	else {//TODO:(reExec == "reExecuteQuery") for graph table sync
		tree.deliverEvent('', 'resultViewComplete');
		$('#executeQuery').removeClass('ui-btn-active');
	}
}

//confirm delete
function confirmDelete(nodeId) {
	tree.deliverEvent(nodeId, 'confirm');
	nodeToDelete = nodeId;
}

//change page title
function changeTitle(title) {
	$("#query-header").html(title);
}

//update sparql query text area
function updateSparqlView() {
	if ($('#sparqlquery').is(":visible")) {
		$("#queryarea").html(tree.getSparqlView());
	}
}

//escape
function escapeHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

//shorten labels
function fitText(txt, num) {
	var rTxt = jQuery.trim(txt).substring(0, num);
	if (rTxt != txt)
		rTxt += "...";
	return rTxt;
}

//set query
function setQuery(id, st) {
	query.status = st;

	if (st != "finalDraft")
		query.id = id;
	else
		query.dId = id;
}

//provide a list of queries
function listQueries(result) {
	var content = "";
	var navbar = "";
	var draftN = 0;
	var savedN = 0;

	//empty the list first
	$('#queryList div').remove();
	$('#queryHeader div').remove();

	//prepare query list
	for (var i = 0; i < result.length; i++) {
		content += '<div data-role="collapsible" class="' + result[i].status + '" ' + (query.id == result[i].queryId ? 'data-theme="b"' : '') + '>';
		content += '<h3>' + result[i].name + (result[i].status == "draft" ? " (draft)" : "") + '</h3>';
		content += '<p>' + result[i].desc + '</p>';
		content += '<input type="button" value="Load" qId="' + result[i].queryId + '" class="loadQuery" data-mini="true" data-icon="arrow-d" data-iconpos="left" data-inline="true">';
		content += '<input type="button" value="Delete" qId="' + result[i].queryId + '" class="deleteQuery" data-mini="true" data-icon="delete" data-iconpos="left" data-inline="true">';
		content += '</div>';

		if (result[i].status == "draft")
			draftN++;
		else
			savedN++;
	}

	//data-position="fixed"
	//navbar += '<div data-role="footer" id="queryFooter" data-id="queryFooter">';
	navbar += '<div data-role="navbar" id="queryBar">';
	navbar += '<ul>';
	navbar += '<li><a href="#" id="allQueries" ' + (openTab == "allQueries" ? 'class="ui-btn-active ui-state-persist"' : '') + '>Total (' + (savedN + draftN) + ')</a></li>';
	navbar += '<li><a href="#" id="savedQueries" ' + (openTab == "savedQueries" ? 'class="ui-btn-active"' : '') + '>Saved (' + (savedN) + ')</a></li>';
	navbar += '<li><a href="#" id="draftQueries" ' + (openTab == "draftQueries" ? 'class="ui-btn-active"' : '') + '>Draft (' + (draftN) + ')</a></li>';
	navbar += '</ul></div>';
	//navbar += '</div>';

	//update the panel content and refresh
	content = $(content);
	navbar = $(navbar);
	content.appendTo('#queryList');
	navbar.appendTo('#queryHeader');
	$("#queryPanel").trigger("create");
	$("#" + openTab).trigger("click");
	// after you delete or load a new query
	// you loose the filter - this retriggers it
	$(".ui-input-text").trigger("keyup");

	// experiment stuff
	if (exp == "true") {
		$('#allQueries').addClass('ui-disabled');
		$('#draftQueries').addClass('ui-disabled');
	}

}

//tree model
function myTree() {
	//init data
	this.json = {
		id : "0",
		data : {
			id : "0",
			label : "Untitled query",
			desc : "Please provide a description here...",
			icon : "",
			$color : "#FF9900",
			sequence : {},
			aggregate : {},
			isActive : true
		},
		children : []
	};
	//end
	//init Spacetree
	//Create a new ST instance
	var st = new $jit.ST({
		//id of viz container element
		injectInto : 'infovis',
		constrained : true,
		levelsToShow : 100,
		//set duration for the animation
		duration : 800,
		offsetX : 300,
		//set animation transition type
		transition : $jit.Trans.Quart.easeInOut,
		//set distance between node and its children
		levelDistance : 90,
		//enable panning
		Navigation : {
			enable : true,
			panning : true
		},

		//set node and edge styles
		//set overridable=true for styling individual
		//nodes or edges
		Node : {
			height : 80,
			width : 150,
			type : 'rectangle',
			color : 'white',
			overridable : true
		},

		Edge : {
			type : 'labeled',
			overridable : true,
			color : "#000"
		},

		Label : {
			overridable : true
		},

		onBeforeCompute : function(node) {
			//
		},

		onAfterCompute : function() {
			//
		},

		onPlaceLabel : function() {
			//
		},

		onAfterCompute : function() {
			informChange("noReExecuteQuery", "noSaveDraft");
		},
		//This method is called on DOM label creation.
		//Use this method to add event handlers and styles to
		//your node.
		onCreateLabel : function(label, node) {
			label.id = node.id;

			//set node label and desc editable for the node 0
			if (node.id == 0) {
				label.innerHTML = '<div id="nlabel_' + node.id + '" class="eNodeLabel" contenteditable><b>' + fitText(node.data.label, 15) + '</b></div>';
				label.innerHTML += '<div id="ndesc_' + node.id + '" class="eNodeDesc" contenteditable>' + node.data.desc + '</div>';
			} else {
				label.innerHTML = '<div id="nlabel_' + node.id + '"><b>' + fitText(node.data.label, 15) + '</b></div>';
			}
			//add output labels
			if (node.data.output) {
				for (var i = 0; i < node.data.output.length; i++) {
					var str = '';

					// stream annt
					if ( typeof node.data.output[i].annt !== 'undefined')
						str = ' style="color:blue"';
					label.innerHTML += '<div id=olabel_' + node.data.output[i].aId + ' class="oAttr"' + str + '>' + fitText(node.data.output[i].label, 15) + '(o)</div>';
				}
			}
			//add constraint labels
			if (node.data.constraint) {
				for (var i = 0; i < node.data.constraint.length; i++) {
					var str = '';

					// stream annt
					if ( typeof node.data.constraint[i].annt !== 'undefined')
						str = ' style="color:blue"';
					label.innerHTML += '<div id=clabel_' + node.data.constraint[i].aId + ' class="cAttr"' + str + '>' + fitText(node.data.constraint[i].label, 15) + '(c)</div>';
				}
			}
			//set the active node
			if (node.data.isActive) {
				activeNode = node.id;
				tree.deliverEvent(activeNode, 'nodeSelected');
			}
			//set the query title
			//if (node.id == 0)
			//	queryTitle = node.data.label;

			label.onclick = function() {
				if (!deleteNode && !sameNode) {
					tree.changeActiveNode(node.id, 'nodeSelected', 'stack');
					//st.onClick(node.id);
					//st.setRoot(node.id, 'animate');
				}
			};
			//set label styles
			var style = label.style;
			style.width = 145 + 'px';
			style.height = 75 + 'px';

			// cursor style
			if (deleteNode || sameNode)
				style.cursor = 'crosshair';
			else
				style.cursor = 'pointer';

			style.color = '#333';
			style.fontSize = '0.8em';
			style.textAlign = 'center';
			style.paddingTop = '3px';
			style.border = '2px solid #006298';
			if (node.data.icon != '')
				style.backgroundImage = 'URL(' + node.data.icon + ')';
			style.backgroundPosition = 'right bottom';
			style.backgroundSize = '40px 40px';
			style.backgroundRepeat = 'no-repeat';
			style.overflow = 'hidden';
		}
	});

	$jit.ST.Plot.EdgeTypes.implement({
		'labeled' : {
			'render' : function(adj, canvas) {
				this.edgeTypes.bezier.render.call(this, adj, canvas);
				var data = adj.data;
				var diff = 10;

				if (data.label != '') {
					var ctx = canvas.getCtx();
					var posFr = adj.nodeFrom.pos.getc(true);
					var posTo = adj.nodeTo.pos.getc(true);
					ctx.font = "bold 11px Helvetica";
					if (posFr.y > posTo.y)
						diff = -10;
					else
						diff = 20;
					ctx.fillText(fitText(data.label, 11), (posFr.x + posTo.x) / 2 - 30, posTo.y + diff);
				}
			}
		}
	});

	// auto load a query
	if (getURLParameter($(parent.location).attr('href'), "q") != null) {
		dataModel.getQuery(getURLParameter($(parent.location).attr('href'), "q"));
	} else {

		//load json data
		st.loadJSON(this.json);

		//experiment stuff
		x = new Date();
		v = 0;

		//compute node positions and layout
		st.compute();
		//optional: make a translation of the tree
		st.geom.translate(new $jit.Complex(-200, 0), "current");
		//emulate a click on the root node.
		st.onClick(st.root);
		//end
	}

	this.loadQuery = function(q) {
		//clear the query obj
		query = new Object();

		if (q === undefined) {
			q = tree.json;
		}

		st.loadJSON(q);
		//compute node positions and layout
		st.compute();
		//optional: make a translation of the tree
		st.geom.translate(new $jit.Complex(-200, 0), "current");
		//emulate a click on the root node.
		st.onClick(st.root);
		//update title
		changeTitle(tree.getAttr("0", "label"));
		//clear stack
		stack.clear();

		// reset the SPARQL view
		$('#sparql').removeClass('ui-btn-active');
		$('#sparqlquery').hide();
		$('#infovis').show();

		// experiment stuff
		x = new Date();
		v = 0;
		if (exp == "true") {
			$('#executeQuery').removeClass('ui-disabled');
			$("#executeQuery .ui-btn-text").text("Run Query (3)");
		}
	}
	//add pair of same nodes
	this.addSame = function(node1, node2) {
		var node = st.graph.getNode(0);
		var indx1 = -1;
		var indx2 = -1;
		var size;

		if ( typeof node.data.sameNodes === 'undefined') {

			node.data.sameNodes = new Array();
			node.data.sameNodes[0] = new Object();
			node.data.sameNodes[0].color = "color here";
			node.data.sameNodes[0].nodes = new Array();
			tree.objPush(node.data.sameNodes[0].nodes, node1);
			tree.objPush(node.data.sameNodes[0].nodes, node2);

		} else {

			$.each(node.data.sameNodes, function(i, obj) {
				if (indx1 == -1 && obj.nodes.indexOf(node1) != -1)
					indx1 = i;
				if (indx2 == -1 && obj.nodes.indexOf(node2) != -1)
					indx2 = i;
			});
			if (indx1 == -1 && indx2 == -1) {
				size = node.data.sameNodes.length;
				node.data.sameNodes[size] = new Object();
				node.data.sameNodes[size].color = "color here";
				node.data.sameNodes[size].nodes = new Array();
				tree.objPush(node.data.sameNodes[size].nodes, node1);
				tree.objPush(node.data.sameNodes[size].nodes, node2);
			} else if (indx1 != -1 && indx2 != -1 && indx1 != indx2) {
				node.data.sameNodes[indx1].nodes = node.data.sameNodes[indx1].nodes.concat(node.data.sameNodes[indx2].nodes);
				node.data.sameNodes.splice(indx2, 1);
			} else if (indx1 != -1 && indx2 == -1) {
				tree.objPush(node.data.sameNodes[indx1].nodes, node2);
			} else if (indx1 == -1 && indx2 != -1) {
				tree.objPush(node.data.sameNodes[indx2].nodes, node1);
			}
		}
	}
	//update time window for temporal
	this.updateTimeWindow = function(data) {
		var node = st.graph.getNode(0);

		if ( typeof node.data.temporal === 'undefined')
			node.data.temporal = new Object();
		node.data.temporal.slide = data.slide;
		node.data.temporal.slider = data.slider;
		node.data.temporal.window = data.window;
		node.data.temporal.windowr = data.windowr;
		node.data.temporal.start = data.start;
		node.data.temporal.end = data.end;

		if ( typeof node.data.temporal.op === "undefined")
			node.data.temporal.op = {};

	}
	//update query conf.
	this.updateQConfig = function(data) {
		Qconfig.distinct = data.distinct;
		Qconfig.longids = data.longids;
		Qconfig.example = data.example;
		Qconfig.longidsv = data.longidsv;
		Qconfig.limit = data.limit;

		updateSparqlView();
		informChange("reExecuteQuery", "saveDraft");
	}
	//add streamop data
	this.updateStreamOp = function(dt, stk) {
		var node = st.graph.getNode(0);
		var prev = new Object();

		prev = node.data.temporal.op;
		node.data.temporal.op = dt;

		//inform change of query
		informChange("reExecuteQuery", "saveDraft");

		if (stk != "noStack") {
			var op = new Object();
			op.prev = prev;
			op.curr = dt;
			stack.push("streamOpUpdated", op);
		}
	}
	//add sequence data
	this.updateSequence = function(dt, stk) {
		var node = st.graph.getNode(0);
		var prev = new Object();

		prev = node.data.sequence;
		node.data.sequence = dt;

		//inform change of query
		informChange("reExecuteQuery", "saveDraft");

		if (stk != "noStack") {
			var seq = new Object();
			seq.prev = prev;
			seq.curr = dt;
			stack.push("sequenceUpdated", seq);
		}
	}
	//add aggregate data
	this.updateAggregate = function(dt, stk) {
		var node = st.graph.getNode(0);
		var prev = new Object();
		var as = new Object();

		//when an aggregate applied over another aggregate
		if (dt.vr == node.data.aggregate.vra)
			dt.vr = node.data.aggregate.vr;

		prev = node.data.aggregate;
		node.data.aggregate = dt;

		//set aggregate variables
		if (!jQuery.isEmptyObject(dt)) {
			var vr = tree.gethId(node.data.aggregate.vr);
			if(vr == "")
				vr = tree.gethId(node.data.aggregate.vr.replace(/_l+$/,"")) + '_label';

			if (dt.op == "count") {
				node.data.aggregate.vra = "COUNT_" + node.data.aggregate.vr;
				node.data.aggregate.vrha = "COUNT_" + vr;
			} else if (dt.op == "sum") {
				node.data.aggregate.vra = "SUM_" + node.data.aggregate.vr;
				node.data.aggregate.vrha = "SUM_" + vr;
			} else if (dt.op == "avg") {
				node.data.aggregate.vra = "AVG_" + node.data.aggregate.vr;
				node.data.aggregate.vrha = "AVG_" + vr
			} else if (dt.op == "max") {
				node.data.aggregate.vra = "MAX_" + node.data.aggregate.vr;
				node.data.aggregate.vrha = "MAX_" + vr;
			} else if (dt.op == "min") {
				node.data.aggregate.vra = "MIN_" + node.data.aggregate.vr;
				node.data.aggregate.vrha = "MIN_" + vr;
			}
		}

		//override sequence data
		if (!jQuery.isEmptyObject(node.data.sequence)) {
			as.seq = new Object();
			
			//aggreagte applied over sequence or aggreagte over a sequence is updated
			if ((node.data.sequence.vr == node.data.aggregate.vr) || (node.data.sequence.vr == prev.vra && node.data.aggregate.vr == prev.vr)) {
				as.seq.prev = node.data.sequence;
				node.data.sequence.vr = node.data.aggregate.vra;
				as.seq.curr = node.data.sequence;
				//previously applied aggreagte over a seqeunce moves to another property or aggregate is removed
			} else if (node.data.sequence.vr == prev.vra && node.data.aggregate.vr != prev.vr) {
				as.seq.prev = node.data.sequence;
				node.data.sequence.vr = prev.vr;
				as.seq.curr = node.data.sequence;
			}
		}

		informChange("reExecuteQuery", "saveDraft");

		if (stk != "noStack") {
			as.agg = new Object();
			as.agg.prev = prev;
			as.agg.curr = dt;
			stack.push("aggregateUpdated", as);
		}
	}
	//add elements on the graph object
	this.addNode = function(source, data, stk, isActive) {
		var e, n;
		var hnode = st.graph.getNode(0);
		var tNode = new Object();
		var dt = new Object();

		if (source == '')
			source = activeNode;

		tNode.id = tree.assignId(1);

		n = st.graph.addNode(tNode);
		n.data = data.concept;
		n.data.hId = tree.var_rep(data.concept.name) + "_" + tNode.id;
		e = st.graph.addAdjacence(st.graph.getNode(source), tNode);
		e.data = data.prop;

		if (isActive == 'active')
			tree.changeActiveNode(tNode.id, 'nodeAdded', 'noStack');
		else
			tree.changeLabelColor(tNode.id, "#FFFFFF");
		informChange("noReExecuteQuery", "saveDraft");

		if (stk != "noStack") {
			dt.pid = source;
			dt.id = n.id;
			dt.data = new Object();
			dt.data.concept = n.data;
			dt.data.prop = e.data;
			stack.push("nodeAdded", dt);
		}

		//refresh
		st.refresh();

	}
	//remove a given node/branch
	this.removeNode = function(nodeId, stk) {
		var hnode = st.graph.getNode(0);
		var node = st.graph.getNode(nodeId);
		var anode = st.graph.getNode(activeNode);
		var pars = node.getParents();
		var nlist = new Object();

		nlist.dt = new Array();
		nlist.activeNode = activeNode;

		//go over delete list for the seq info
		st.graph.eachBFS(nodeId, function(n) {
			if (n.isDescendantOf(nodeId) && n.id != 0) {
				var nd = new Object();
				nd.data = new Object();
				var e = st.graph.getAdjacence(n.id, n.getParents()[0].id);

				nd.pid = n.getParents()[0].id;
				nd.id = n.id;
				nd.data.concept = n.data;
				nd.data.prop = e.data;

				//store and remove sequence data
				if (!jQuery.isEmptyObject(hnode.data.sequence)) {
					var r = (hnode.data.sequence.vr == hnode.data.aggregate.vra) ? hnode.data.aggregate.vr : "";
					if (!jQuery.isEmptyObject(nd.data.concept.output)) {
						var t = jQuery.grep(nd.data.concept.output, function(out) {
							return out.aId == hnode.data.sequence.vr || out.aId == r;
						});
					}

					if (hnode.data.sequence.vr == nd.id || nd.id == r || !jQuery.isEmptyObject(t)) {
						nd.seq = hnode.data.sequence;
						hnode.data.sequence = {};
					}
				}

				//store and remove aggregate data
				if (!jQuery.isEmptyObject(hnode.data.aggregate)) {
					if (!jQuery.isEmptyObject(nd.data.concept.output)) {
						t = jQuery.grep(nd.data.concept.output, function(out) {
							return out.aId == hnode.data.aggregate.vr;
						});
					}

					if (hnode.data.aggregate.vr == nd.id || !jQuery.isEmptyObject(t)) {
						nd.agg = hnode.data.aggregate;
						hnode.data.aggregate = {};
					}
				}

				//store and remove streamop data
				if (!jQuery.isEmptyObject(hnode.data.temporal)) {
					if (!jQuery.isEmptyObject(nd.data.concept.output)) {
						t = jQuery.grep(nd.data.concept.output, function(out) {
							return out.aId == hnode.data.temporal.op.vr;
						});
					}

					if (hnode.data.temporal.op.vr == nd.id || !jQuery.isEmptyObject(t)) {
						nd.stOp = hnode.data.temporal.op;
						hnode.data.temporal.op = {};
					}
				}

				nlist.dt.push(nd);
			}
		});

		//push deleted nodes to stack
		if (stk != "noStack") {
			stack.push("nodesRemoved", nlist);
		}

		if (nodeId == 0) {
			tree.changeActiveNode(node.id, 'nodeSelected', 'noStack');
			st.removeSubtree(nodeId, false, 'replot', {
				hideLabels : false
			});
		} else if (nodeId == activeNode) {
			tree.changeActiveNode(pars[0].id, 'nodeSelected', 'noStack');
			st.removeSubtree(nodeId, true, 'replot', {
				hideLabels : false
			});
		} else if (anode.isDescendantOf(nodeId)) {
			tree.changeActiveNode(pars[0].id, 'nodeSelected', 'noStack');
			st.removeSubtree(nodeId, true, 'replot', {
				hideLabels : false
			});
		} else {
			st.removeSubtree(nodeId, true, 'replot', {
				hideLabels : false
			});
		}
		//save draft
		informChange("noReExecuteQuery", "saveDraft");
	}
	//assign a unique id to each node
	this.assignId = function(indx) {
		if (st.graph.hasNode('c' + indx)) {
			return this.assignId(indx + 1);
		}
		return 'c' + indx;
	}
	// add attribute label to the node
	this.addLabelAttr = function(data, s) {
		//should not be the active node, read from data
		var label = st.labels.getLabel(activeNode);
		var str = '';

		// stream annt
		if ( typeof data.annt !== 'undefined')
			str = ' style="color:blue"';

		$(label).children('#' + s + 'label_' + data.aId).remove();
		label.innerHTML += '<div id=' + s + 'label_' + data.aId + ' class="' + s + 'Attr"' + str + '>' + fitText(data.label, 15) + '(' + s + ')</div>';
	}
	//remove attribute label from the node
	this.removeLabelAttr = function(data, s) {
		var label = st.labels.getLabel(activeNode);
		$(label).children('#' + s + 'label_' + data.aId).remove();
	}
	//change the color of a given node
	this.changeLabelColor = function(nodeId, color) {
		var node = st.graph.getNode(nodeId);
		node.data.$color = color;
		st.refresh();
	}
	//change the active node
	this.changeActiveNode = function(nodeId, type, stk) {
		var node = st.graph.getNode(nodeId);
		var anode = st.graph.getNode(activeNode);
		var data = new Object();

		//push it into stack
		if (stk != 'noStack' && nodeId != anode.id) {
			data.prev = anode.id;
			data.next = node.id;
			stack.push('activeNodeChanged', data);
		}

		nodeName = node.data.label;

		tree.changeLabelColor(activeNode, "#FFFFFF");
		delete anode.data.isActive;
		activeNode = nodeId;
		node.data.isActive = true;
		changeTitle(nodeName);
		tree.changeLabelColor(activeNode, "#FF9900");

		tree.deliverEvent(nodeId, type);
		informChange("noReExecuteQuery", "noSaveDraft");
	}
	//update data attribute of a node
	this.updateAttr = function(nodeId, attr, value) {
		var node = st.graph.getNode(nodeId);
		if ( typeof node.data[attr] !== "undefined")
			node.data[attr] = value;
	}
	//get data attribute of a node
	this.getAttr = function(nodeId, attr) {
		var node = st.graph.getNode(nodeId);
		if ( typeof node.data[attr] !== "undefined")
			return node.data[attr];
	}
	//remove an attribute from node
	this.remAttr = function(nodeId, attr) {
		var node = st.graph.getNode(nodeId);
		if ( typeof node.data[attr] !== "undefined")
			delete node.data[attr];
	}
	//is node leaf
	this.isLeaf = function(nodeId) {
		var node = st.graph.getNode(nodeId);
		if (node.getSubnodes().length > 1)
			return 0;
		else
			return 1;
	}
	this.assignNsId = function(arr, uri) {
		var id;
		//check if page already exists
		if (arr.indexOf(uri) >= 0) {
			id = "ns" + (arr.indexOf(uri) + 1);
		} else {
			id = "ns" + (arr.length + 1);
			arr[arr.length] = uri;
		}

		return id;
	}
	this.objPush = function(obj, item) {
		if (obj.indexOf(item) == -1)
			obj.push(item);
	}
	//get the human readable id
	this.gethId = function(id) {
		var t = "";
		st.graph.eachBFS("0", function(n) {
			if (n.id != 0) {
				if (n.id == id) {
					t = n.data.hId;
				}

				if (!jQuery.isEmptyObject(n.data.output) && t == "") {
					var x = jQuery.grep(n.data.output, function(o) {
						return o.aId == id;
					});
					if (x.length != 0) {
						t = x[0].hId;
					}
				}
			}
		});

		return t;
	}
	this.getOutputVars = function() {
		var vrs = new Array();

		st.graph.eachBFS("0", function(n) {
			if (n.id != 0) {
				var obj = new Object();
				var obj2 = new Object();

				obj.hId = n.data.hId;
				obj.id = n.id;
				obj.ow = "self";
				obj.typ = "concept";
				vrs.push(obj);

				obj2.hId = n.data.hId + '_label';
				obj2.id = n.id + '_l';
				obj2.ow = n.id;
				obj2.typ = "label";
				vrs.push(obj2);

				if (!jQuery.isEmptyObject(n.data.output)) {
					for ( i = 0; i < n.data.output.length; i++) {
						var obj = new Object();
						obj.hId = n.data.output[i].hId;
						obj.id = n.data.output[i].aId;
						obj.typ = n.data.output[i].type;
						obj.ow = n.id;
						obj.annt = ( typeof n.data.output[i].annt !== "undefined" ? n.data.output[i].annt : "none");
						vrs.push(obj);

						// add type labels
						if(n.data.output[i].id == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){
							var obj2 = new Object();
							obj2.hId = n.data.output[i].hId+ '_label';
							obj2.id = n.data.output[i].aId + '_l';
							obj2.ow = n.id;
							obj2.typ = "label";
							vrs.push(obj2);
						}

					}
				}
			}
		});

		return vrs;
	}
	this.var_rep = function(vr) {
		return vr.replace('-', '_');
	}
	//recolor for stream
	this.stream_recolor = function() {
		var stream = isStream();
		if (stream >= 0) {
			st.graph.eachBFS('0', function(tnode) {
				if (tnode.id != '0') {
					if (tnode.getParents()[0].id != "0") {
						var snode = tnode.getParents()[0];
						var pnode = snode.getParents()[0];
						var edge = tnode.getAdjacency(snode.id);
						var pedge = pnode.getAdjacency(snode.id);

						if (edge.data.annt == "stream" || pedge.data.$color == "blue") {
							var l = st.labels.getLabel(tnode.id);
							edge.data.$color = "blue";
							edge.data.$lineWidth = 3;
							l.style.height = "73px";
							l.style.width = "143px";
							l.style.border = "3px solid blue"
						}
					}
				}
			});
		}
		return st;
	}
	//extract SPARQL
	this.toSparqlObj = function() {
		//dates
		var date1;
		var date2;
		//rdf namespace
		var rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
		var xsd = 'http://www.w3.org/2001/XMLSchema#';
		var rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
		//sparql object
		var SparqlObj = new Object();
		//name space prefixes
		SparqlObj.prfx = new Array();
		var prfxArr = new Array();
		//selected variables
		SparqlObj.slct = new Array();
		SparqlObj.slcts = new Array();
		//selected variables definitions
		SparqlObj.slcdf = new Array();
		SparqlObj.slcdfs = new Array();
		//class descriptions
		SparqlObj.clsdf = new Array();
		SparqlObj.clsdfs = new Array();
		//object relationships
		SparqlObj.reldf = new Array();
		SparqlObj.reldfs = new Array();
		//attribute constraints
		SparqlObj.cons = new Array();
		SparqlObj.conss = new Array();
		//filter
		SparqlObj.flt = new Array();
		SparqlObj.flts = new Array();
		//limit
		SparqlObj.seq = "";
		SparqlObj.seqs = "";
		//groupBy
		SparqlObj.grpby = "";
		SparqlObj.grpbys = "";
		//stream
		SparqlObj.streamv = "";
		SparqlObj.streamp = new Array();

		SparqlObj.isStreaming = function() {
			return this.streamv != '' || this.streamp.length > 0;
		};

		var root = st.graph.getNode(0);

		tree.objPush(SparqlObj.prfx, 'PREFIX ' + tree.assignNsId(prfxArr, rdf) + ': <' + rdf + '>');
		tree.objPush(SparqlObj.prfx, 'PREFIX ' + tree.assignNsId(prfxArr, xsd) + ': <' + xsd + '>');
		tree.objPush(SparqlObj.prfx, 'PREFIX ' + tree.assignNsId(prfxArr, rdfs) + ': <' + rdfs + '>');

		//make a breath first traversal
		st.graph.eachBFS('0', function(node) {
			if (node.id != 0) {
				//push prefix definition
				tree.objPush(SparqlObj.prfx, 'PREFIX ' + tree.assignNsId(prfxArr, node.data.ns) + ': <' + node.data.ns + '>');
				//push class definition
				tree.objPush(SparqlObj.clsdf, '?' + node.id + ' ' + tree.assignNsId(prfxArr, rdf) + ':type ' + tree.assignNsId(prfxArr, node.data.ns) + ':' + node.data.name + '.');
				tree.objPush(SparqlObj.clsdfs, '?' + node.data.hId + ' ' + tree.assignNsId(prfxArr, rdf) + ':type ' + tree.assignNsId(prfxArr, node.data.ns) + ':' + node.data.name + '.');
				//remove this later - variable itself in the result list
				tree.objPush(SparqlObj.slct, '?' + node.id);
				tree.objPush(SparqlObj.slcts, '?' + node.data.hId);
				tree.objPush(SparqlObj.slct, '?' + node.id + '_l');
				tree.objPush(SparqlObj.slcts, '?' + node.data.hId + '_label');
				//push rel def for labels
				//tree.objPush(SparqlObj.reldf, 'OPTIONAL{?' + node.id + ' ' + tree.assignNsId(prfxArr, rdfs) + ':label' + ' ?' + node.id + '_l.}');
				//tree.objPush(SparqlObj.reldfs, 'OPTIONAL{?' + node.data.hId + ' ' + tree.assignNsId(prfxArr, rdfs) + ':label' + ' ?' + node.data.hId + '_label.}');
				//push relationships
				node.eachSubnode(function(snode) {
					//push prefix definition
					tree.objPush(SparqlObj.prfx, 'PREFIX ' + tree.assignNsId(prfxArr, snode.getAdjacency(node.id).data.ns) + ': <' + snode.getAdjacency(node.id).data.ns + '>');
					//push relationship definition
					tree.objPush(SparqlObj.reldf, '?' + node.id + ' ' + tree.assignNsId(prfxArr, snode.getAdjacency(node.id).data.ns) + ':' + snode.getAdjacency(node.id).data.name + ' ?' + snode.id + '.');
					tree.objPush(SparqlObj.reldfs, '?' + node.data.hId + ' ' + tree.assignNsId(prfxArr, snode.getAdjacency(node.id).data.ns) + ':' + snode.getAdjacency(node.id).data.name + ' ?' + snode.data.hId + '.');

					// set stream properties
					if ( typeof snode.getAdjacency(node.id).data.annt !== "undefined")
						tree.objPush(SparqlObj.streamp, tree.assignNsId(prfxArr, snode.getAdjacency(node.id).data.ns) + ':' + snode.getAdjacency(node.id).data.name);

				});
				//push output attributes
				if ( typeof node.data.output !== 'undefined') {
					$.each(node.data.output, function(index, result) {
						//push output variable
						tree.objPush(SparqlObj.slct, '?' + result['aId']);
						tree.objPush(SparqlObj.slcts, '?' + result['hId']);

						// if rdf:type get the label as well
						if((result['ns']+result['name']) == rdf+'type'){
							tree.objPush(SparqlObj.slct, '?' + result['aId'] + '_l');
							tree.objPush(SparqlObj.slcts, '?' + result['hId'] + '_label');
						}

						//push prefix definition
						tree.objPush(SparqlObj.prfx, 'PREFIX ' + tree.assignNsId(prfxArr, result['ns']) + ': <' + result['ns'] + '>');
						//push attribute definition -- TODO: revert optional
						tree.objPush(SparqlObj.slcdf, '?' + node.id + ' ' + tree.assignNsId(prfxArr, result['ns']) + ':' + result['name'] + ' ?' + result['aId'] + '.');
						tree.objPush(SparqlObj.slcdfs, '?' + node.data.hId + ' ' + tree.assignNsId(prfxArr, result['ns']) + ':' + result['name'] + ' ?' + result['hId'] + '.');
						//tree.objPush(SparqlObj.slcdf, 'OPTIONAL{?' + node.id + ' ' + tree.assignNsId(prfxArr, result['ns']) + ':' + result['name'] + ' ?' + result['aId'] + '.}');
						//tree.objPush(SparqlObj.slcdfs, 'OPTIONAL{?' + node.data.hId + ' ' + tree.assignNsId(prfxArr, result['ns']) + ':' + result['name'] + ' ?' + result['hId'] + '.}');

						// set stream properties
						if ( typeof result['annt'] !== "undefined")
							tree.objPush(SparqlObj.streamp, tree.assignNsId(prfxArr, result['ns']) + ':' + result['name']);

					});
				}
				//push constraints
				if ( typeof node.data.constraint !== 'undefined') {
					$.each(node.data.constraint, function(index, result) {
						// check ext data coming from widgets, e.g., map
						// this is probably not necessary anymore!
						var ext = "";
						if ( typeof result.ext !== 'undefined') {
							// for temporal constraint
							if (result.ext.origin == "temporal") {
								ext = "@[NOW-" + result.ext.time + "*" + result.ext.pulse + "]"
							}
						}

						if (result['id'] != rdf + 'type') {
							//push prefix definition
							tree.objPush(SparqlObj.prfx, 'PREFIX ' + tree.assignNsId(prfxArr, result['ns']) + ': <' + result['ns'] + '>');
							
							//push attribute definition
							// avoid filter in STREAM
							if (isStream() > 0) {
								tree.objPush(SparqlObj.slcdf, '?' + node.id + ' ' + tree.assignNsId(prfxArr, result['ns']) + ':' + result['name'] + ' "' + result['constr'] + '"^^'+ tree.assignNsId(prfxArr, xsd) +':' + result['type'] + '.');
								tree.objPush(SparqlObj.slcdfs, '?' + node.data.hId + ' ' + tree.assignNsId(prfxArr, result['ns']) + ':' + result['name'] + ' "' + result['constr'] + '"^^'+ tree.assignNsId(prfxArr, xsd) +':' + result['type'] + '.');
							} else {
								tree.objPush(SparqlObj.slcdf, '?' + node.id + ' ' + tree.assignNsId(prfxArr, result['ns']) + ':' + result['name'] + ' ?' + result['aId'] + '.');
								tree.objPush(SparqlObj.slcdfs, '?' + node.data.hId + ' ' + tree.assignNsId(prfxArr, result['ns']) + ':' + result['name'] + ' ?' + result['hId'] + '.');
							}

							// set stream properties
							if ( typeof result['annt'] !== "undefined")
								tree.objPush(SparqlObj.streamp, tree.assignNsId(prfxArr, result['ns']) + ':' + result['name']);

							if (result['constrType'] == 'eq' && isStream() <= 0) {
								//SparqlObj.cons.push('?' + node.id + ' npdv:' + result['name'] + ' "' + result['constr'] + '".');
								//push filter defintion
								//tree.objPush(SparqlObj.flt, 'FILTER(STR(?' + result['aId'] + ') = "' + result['constr'] + '").');
								if (result['type'] == 'dateTime') {
									var date1 = new Date(result['constr']);
									tree.objPush(SparqlObj.flt, 'FILTER(?' + result['aId'] + ' = "' + date1.toISOString() + '"^^' + + '"^^'+ tree.assignNsId(prfxArr, xsd) +':dateTime)' + ext + '.');
									tree.objPush(SparqlObj.flts, 'FILTER(?' + result['hId'] + ' = "' + date1.toISOString() + '"^^'+ tree.assignNsId(prfxArr, xsd) + ':dateTime)' + ext + '.');
								} else {
									tree.objPush(SparqlObj.flt, 'FILTER(regex(?' + result['aId'] + ', "' + result['constr'] + '", "i"))' + ext + '.');
									tree.objPush(SparqlObj.flts, 'FILTER(regex(?' + result['hId'] + ', "' + result['constr'] + '", "i"))' + ext + '.');
								}
							} else if (result['constrType'] == 'greater' && isStream() <= 0) {
								//push filter defintion
								if (result['type'] == 'dateTime') {
									var date1 = new Date(result['constrHigh']);
									tree.objPush(SparqlObj.flt, 'FILTER(?' + result['aId'] + ' >= "' + date1.toISOString() + '"^^'+ tree.assignNsId(prfxArr, xsd) + ':dateTime)' + ext + '.');
									tree.objPush(SparqlObj.flts, 'FILTER(?' + result['hId'] + ' >= "' + date1.toISOString() + '"^^'+ tree.assignNsId(prfxArr, xsd) + ':dateTime)' + ext + '.');
								} else {
									tree.objPush(SparqlObj.flt, 'FILTER(?' + result['aId'] + ' >= ' + result['constrHigh'] + ')' + ext + '.');
									tree.objPush(SparqlObj.flts, 'FILTER(?' + result['hId'] + ' >= ' + result['constrHigh'] + ')' + ext + '.');
								}
							} else if (result['constrType'] == 'lower' && isStream() <= 0) {
								//push filter defintion
								if (result['type'] == 'dateTime') {
									var date1 = new Date(result['constrLow']);
									tree.objPush(SparqlObj.flt, 'FILTER(?' + result['aId'] + ' <= "' + date1.toISOString() + '"^^'+ tree.assignNsId(prfxArr, xsd) + ':dateTime)' + ext + '.');
									tree.objPush(SparqlObj.flts, 'FILTER(?' + result['hId'] + ' <= "' + date1.toISOString() + '"^^'+ tree.assignNsId(prfxArr, xsd) + ':dateTime)' + ext + '.');
								} else {
									tree.objPush(SparqlObj.flt, 'FILTER(?' + result['aId'] + ' <= ' + result['constrLow'] + ')' + ext + '.');
									tree.objPush(SparqlObj.flts, 'FILTER(?' + result['hId'] + ' <= ' + result['constrLow'] + ')' + ext + '.');
								}
							} else if (result['constrType'] == 'range' && isStream() <= 0) {
								//push filter defintion
								if (result['type'] == 'dateTime') {
									var date1 = new Date(result['constrHigh']);
									var date2 = new Date(result['constrLow']);
									tree.objPush(SparqlObj.flt, 'FILTER(?' + result['aId'] + ' >= "' + date1.toISOString() + '"^^' + tree.assignNsId(prfxArr, xsd) + ':dateTime && ?' + result['aId'] + ' <= "' + date2.toISOString() + '"^^' + tree.assignNsId(prfxArr, xsd) + ':dateTime)' + ext + '.');
									tree.objPush(SparqlObj.flts, 'FILTER(?' + result['hId'] + ' >= "' + date1.toISOString() + '"^^'+ tree.assignNsId(prfxArr, xsd) + ':dateTime && ?' + result['hId'] + ' <= "' + date2.toISOString() + '"^^' +tree.assignNsId(prfxArr, xsd) + ':dateTime)' + ext + '.');
								} else {
									tree.objPush(SparqlObj.flt, 'FILTER(?' + result['aId'] + ' >= ' + result['constrHigh'] + ' && ?' + result['aId'] + ' <= ' + result['constrLow'] + ')' + ext + '.');
									tree.objPush(SparqlObj.flts, 'FILTER(?' + result['hId'] + ' >= ' + result['constrHigh'] + ' && ?' + result['hId'] + ' <= ' + result['constrLow'] + ')' + ext + '.');
								}
							}
						} else {
							for (var i = 0; i < result.type.length; i++) {
								//push prefix definition
								tree.objPush(SparqlObj.prfx, 'PREFIX ' + tree.assignNsId(prfxArr, result.type[i].ns) + ': <' + result.type[i].ns + '>');
								//push class definition
								tree.objPush(SparqlObj.clsdf, '?' + node.id + ' ' + tree.assignNsId(prfxArr, rdf) + ':type ' + tree.assignNsId(prfxArr, result.type[i].ns) + ':' + result.type[i].name + '.');
								tree.objPush(SparqlObj.clsdfs, '?' + node.data.hId + ' ' + tree.assignNsId(prfxArr, rdf) + ':type ' + tree.assignNsId(prfxArr, result.type[i].ns) + ':' + result.type[i].name + '.');
							}
						}
					});
				}
			}
		});

		// set the stream values
		if ( typeof root.data.temporal !== "undefined")
			SparqlObj.streamv = root.data.temporal;

		//inject sequencing constraints
		if (!jQuery.isEmptyObject(root.data.sequence)) {
 			var vr = "";
			if (root.data.aggregate.vra == root.data.sequence.vr){
				vr = root.data.aggregate.vrha;
			}
			else{
				vr = tree.gethId(root.data.sequence.vr);
				if(vr == "")
					vr = tree.gethId(root.data.sequence.vr.replace(/_l+$/,"")) + '_label';
			}

			if (root.data.sequence.op == "sortdown") {
				SparqlObj.seq = "ORDER BY DESC(?" + root.data.sequence.vr + ")";
				SparqlObj.seqs = "ORDER BY DESC(?" + vr + ")";
			}
			if (root.data.sequence.op == "sortup") {
				SparqlObj.seq = "ORDER BY ASC(?" + root.data.sequence.vr + ")";
				SparqlObj.seqs = "ORDER BY ASC(?" + vr + ")";
			}
		}
		//inject aggreagtion constraints
		if (!jQuery.isEmptyObject(root.data.aggregate)) {
			var i = SparqlObj.slct.indexOf("?" + root.data.aggregate.vr);
			var tmp_vr = "";
			var vr = tree.gethId(root.data.aggregate.vr);
			if(vr == "")
				vr = tree.gethId(root.data.aggregate.vr.replace(/_l+$/,"")) + '_label';

			SparqlObj.slct[i] = "("+ root.data.aggregate.op.toUpperCase() +"(?" + root.data.aggregate.vr + ") AS ?" + root.data.aggregate.vra + ")";
			SparqlObj.slcts[i] = "(" + root.data.aggregate.op.toUpperCase() + "(?" + vr + ") AS ?" + root.data.aggregate.vrha + ")";

			//fix group by
			for (var x = 0; x < SparqlObj.slct.length; x++) {
				if(x != i){
					SparqlObj.grpby += " " + SparqlObj.slct[x];
					SparqlObj.grpbys += " " + SparqlObj.slcts[x];
				}
			}
			if (SparqlObj.grpby != "") {
				SparqlObj.grpby = "GROUP BY" + SparqlObj.grpby;
				SparqlObj.grpbys = "GROUP BY" + SparqlObj.grpbys;
			}
		}

		return SparqlObj;
	}
	//deal with inverse
	this.invCorr = function(q) {
		var arr = q.split(" ");
		var str = "";
		for (var i = 0; i < arr.length; i++) {
			//solution for field_name
			if (arr[i].indexOf("^") != -1 && arr[i].indexOf("^^") == -1)
				arr[i] = "^" + arr[i].replace("^", "");
			str += " " + arr[i];
		}
		return str;
	}
	//to plain text
	this.getSparql = function(SparqlObj) {
		var query = '';
		var distinct = '';
		var limit = '';
		var lid = '';

		if (Qconfig.distinct == 'yes')
			distinct = ' DISTINCT';
		if (Qconfig.limit != 0)
			limit = ' LIMIT ' + Qconfig.limit;
		if (Qconfig.longids == 'yes')
			lid = 's';

		for (var i = 0; i < SparqlObj.prfx.length; i++)
			query += SparqlObj.prfx[i] + '\n';
		query += '\nSELECT' + distinct;
		for (var i = 0; i < eval("SparqlObj.slct" + lid).length; i++)
			query += " " + eval("SparqlObj.slct"+lid)[i];
		query += ' WHERE {\n';
		for (var i = 0; i < eval("SparqlObj.slcdf" + lid).length; i++)
			query += '\t' + eval("SparqlObj.slcdf"+lid)[i] + '\n';
		for (var i = 0; i < eval("SparqlObj.cons" + lid).length; i++)
			query += '\t' + eval("SparqlObj.cons"+lid)[i] + '\n';
		for (var i = 0; i < eval("SparqlObj.flt" + lid).length; i++)
			query += '\t' + eval("SparqlObj.flt"+lid)[i] + '\n';
		for (var i = 0; i < eval("SparqlObj.clsdf" + lid).length; i++)
			query += '\t' + eval("SparqlObj.clsdf"+lid)[i] + '\n';
		for (var i = 0; i < eval("SparqlObj.reldf" + lid).length; i++)
			query += '\t' + eval("SparqlObj.reldf"+lid)[i] + '\n';
		query += '}';
		if (eval("SparqlObj.grpby" + lid) != '')
			query += " " + eval("SparqlObj.grpby" + lid);
		if (eval("SparqlObj.seq" + lid) != '')
			query += " " + eval("SparqlObj.seq" + lid);
		query += limit;

		query = tree.invCorr(query);

		return query;
	}
	//to plain text (streaming query)
	this.getStarql = function(sparqlObj) {
		switch (sparqlObj.streamv.op.op) {
		case undefined:
			// When we press "Run Query", this gets called a first
			// time, but the user did not have the possibility to
			// select a template yet
			return "";
		// For possible values for op, see ../../TableOptique/js/main.js
		case "moninc":
			starqlTemplate = StarqlMonIncTemplate;
			break;
		case "echo":
			starqlTemplate = StarqlEchoTemplate;
			break;
		case "range":
			starqlTemplate = StarqlRangeTemplate;
			break;
		case "gradientcheck":
			starqlTemplate = StarqlGradientCheckTemplate;
			break;
		case "loggingfault":
			starqlTemplate = StarqlLoggingFaultTemplate;
			break;
		default:
			return "";
		}
		var query = "";
		var distinct = '';
		var limit = '';
		var lid = '';
		var params = sparqlObj.streamv.op.params;
		var streamname = getURLParameter($(parent.location).attr('href'), "repository");

		if (Qconfig.distinct == 'yes')
			distinct = ' DISTINCT';
		if (Qconfig.limit != 0)
			limit = ' LIMIT ' + Qconfig.limit;
		if (Qconfig.longids == 'yes')
			lid = 's';
		var slct = eval("sparqlObj.slct" + lid);
		var clsdf = eval("sparqlObj.clsdf" + lid);
		var reldf = eval("sparqlObj.reldf" + lid);
		var slcdf = eval("sparqlObj.slcdf" + lid);
		var cons = eval("sparqlObj.cons" + lid);
		var flt = eval("sparqlObj.flt" + lid);
		var grpby = eval("sparqlObj.grpby" + lid);
		var seq = eval("sparqlObj.seq" + lid);

		var streamsub = new Array();
		var streampred = new Array();
		for (var tripleind = 0; tripleind < slcdf.length; tripleind++) {
			for (var predind = 0; predind < sparqlObj.streamp.length; predind++) {
				var match = slcdf[tripleind].indexOf(sparqlObj.streamp[predind]);
				if (match > -1) {
					streamsub.push(slcdf[tripleind].substring(0, match - 1));
					streampred.push(sparqlObj.streamp[predind]);
				}
			}
		}

		var streamslide = '"' + sparqlObj.streamv['slide'] + sparqlObj.streamv['slider'] + '"';
		var streamwindow = '"' + sparqlObj.streamv['window'] + sparqlObj.streamv['windowr'] + '"';
		var streamstart = sparqlObj.streamv['start'];
		var streamend = sparqlObj.streamv['end'];

		for (var i = 0; i < sparqlObj.prfx.length; i++)
			query += sparqlObj.prfx[i] + '\n';
		query += '\nCREATE STREAM S_out AS';
		query += '\nSELECT' + distinct + " {";
		for (var i = 0; i < streamsub.length; i++) {
			query += " " + starqlTemplate.getSelectClause(streamsub[i], streampred[i], i, params);
		}
		query += " }"
		query += '\nFROM STREAM ' + streamname + ' [NOW - ' + streamwindow + '^^xsd:duration, NOW]->' + streamslide + '^^xsd:duration';
		if (streamstart != "") {
			query += '\nUSING PULSE WITH START = "' + streamstart + '"';
			if (streamend != "") {
				query += ', END = "' + streamend + '"';
			}
		}
		query += '\nWHERE {\n';
		for (var i = 0; i < clsdf.length; i++)
			query += '\t' + clsdf[i] + '\n';
		for (var i = 0; i < reldf.length; i++) {
			for (var predind = 0; predind < sparqlObj.streamp.length; predind++) {
				var match = reldf[i].indexOf(sparqlObj.streamp[predind]);
				if (match == -1) {
					query += '\t' + reldf[i] + '\n';
				}
			}
		}
		for (var i = 0; i < slcdf.length; i++) {
			for (var predind = 0; predind < sparqlObj.streamp.length; predind++) {
				var match = slcdf[i].indexOf(sparqlObj.streamp[predind]);
				if (match == -1) {
					query += '\t' + slcdf[i] + '\n';
				}
			}
		}
		for (var i = 0; i < cons.length; i++)
			query += '\t' + cons[i] + '\n';
		for (var i = 0; i < flt.length; i++)
			query += '\t' + flt[i] + '\n';
		query += '}';
		query += '\nSEQUENCE BY StdSeq AS seq\n';
		query += 'HAVING ';
		for (var i = 0; i < streamsub.length; i++) {
			query += " " + starqlTemplate.getHavingClause(streamsub[i], streampred[i], i, params);
		}

		query = tree.invCorr(query).trim();
		return query;
	}
	//to HTML
	this.getSparqlView = function() {
		var SparqlObj = tree.toSparqlObj();

		var query = '';
		if (SparqlObj.isStreaming()) {
			query = tree.getStarql(SparqlObj);
			query = query.replace(/&/g, '&amp;');
			query = query.replace(/</g, '&lt;');
			query = query.replace(/>/g, '&gt;');
			return '<pre>' + query + '</pre>';
		}

		var actv = '';
		var distinct = '';
		var limit = '';
		var lid = '';

		if (Qconfig.distinct == 'yes')
			distinct = ' DISTINCT';
		if (Qconfig.limit != 0)
			limit = ' LIMIT ' + Qconfig.limit;
		if (Qconfig.longidsv == 'yes')
			lid = 's';

		for (var i = 0; i < SparqlObj.prfx.length; i++)
			query += escapeHtml(SparqlObj.prfx[i]) + ' <br/>';
		query += '<br>SELECT' + distinct;
		for (var i = 0; i < eval("SparqlObj.slct" + lid).length; i++)
			query += " " + eval("SparqlObj.slct"+lid)[i];
		query += ' WHERE { <br/>';
		for (var i = 0; i < eval("SparqlObj.clsdf" + lid).length; i++)
			query += '<span class="line">' + eval("SparqlObj.clsdf"+lid)[i] + '</span><br/>';
		for (var i = 0; i < eval("SparqlObj.reldf" + lid).length; i++)
			query += '<span class="line">' + eval("SparqlObj.reldf"+lid)[i] + '</span><br/>';
		for (var i = 0; i < eval("SparqlObj.slcdf" + lid).length; i++)
			query += '<span class="line">' + eval("SparqlObj.slcdf"+lid)[i] + '</span><br/>';
		for (var i = 0; i < eval("SparqlObj.cons" + lid).length; i++)
			query += '<span class="line">' + eval("SparqlObj.cons"+lid)[i] + '</span><br/>';
		for (var i = 0; i < eval("SparqlObj.flt" + lid).length; i++)
			query += '<span class="line">' + eval("SparqlObj.flt"+lid)[i] + '</span><br/>';
		// limit added
		query += '}';
		if (eval("SparqlObj.grpby" + lid) != '')
			query += " " + eval("SparqlObj.grpby" + lid);
		if (eval("SparqlObj.seq" + lid) != '')
			query += " " + eval("SparqlObj.seq" + lid);
		query += limit;

		st.graph.eachBFS('0', function(node) {
			var id = '';
			if (Qconfig.longidsv == 'yes')
				id = node.data.hId;
			else
				id = node.id;

			var reg = new RegExp('\\?' + id, "g");
			if (node.id == activeNode)
				actv = 'textActiveNode';
			query = query.replace(reg, '<a href="#" txt_id="' + node.id + '" class="textNode ' + actv + '">' + '?' + id + '</a>');
			actv = '';
		});

		query = tree.invCorr(query);

		return query;
	}
	//add constraint to the graph structure
	this.addConstraint = function(data, stk) {
		var anode = st.graph.getNode(activeNode);
		var prev = new Object();
		var dt = new Object();
		var rmIndx;

		data.aId = tree.assignAId(anode, data);
		data.hId = tree.var_rep(data.name) + "_" + tree.assignAId(anode, data);

		//check if contraint object exist for the node
		if ( typeof anode.data.constraint === 'undefined') {
			var constraint = new Array();
			anode.data.constraint = constraint;
		} else {
			$.each(anode.data.constraint, function(index, result) {
				if (result['id'] == data.id) {
					rmIndx = index;
				}
			});
			//Remove from array
			if ( typeof rmIndx !== 'undefined') {
				prev = anode.data.constraint[rmIndx];
				anode.data.constraint.splice(rmIndx, 1);
			}
		}

		//push it into stack
		if (stk != 'noStack') {
			dt.prev = prev;
			dt.curr = data;
			stack.push('constraintAdded', dt);
		}

		anode.data.constraint.push(data);
		tree.addLabelAttr(data, 'c');
		//save draft
		informChange("noReExecuteQuery", "saveDraft");
	}
	//remove constraint from the graph structure
	this.removeConstraint = function(data, stk) {
		var anode = st.graph.getNode(activeNode);
		var prev = new Object();
		var aId;
		var rmIndx;

		if ( typeof anode.data.constraint !== 'undefined') {
			$.each(anode.data.constraint, function(index, result) {
				if (result['id'] == data.id) {
					aId = result["aId"];
					rmIndx = index;
				}
			});

			//Remove from array
			if ( typeof rmIndx !== 'undefined') {
				prev = anode.data.constraint[rmIndx];
				anode.data.constraint.splice(rmIndx, 1);
			}
		}

		//push it into stack
		if (stk != 'noStack') {
			data = prev;
			stack.push('constraintRemoved', data);
		}

		data.aId = aId;
		tree.removeLabelAttr(data, 'c');
		//save draft
		informChange("noReExecuteQuery", "saveDraft");
	}
	//assign an id to attribute
	this.assignAId = function(node, data) {
		var aId;
		var idArr = new Array();

		//check output
		if ( typeof node.data.output !== 'undefined') {
			$.each(node.data.output, function(index, result) {
				if (result["id"] == data.id)
					aId = result["aId"];
			});
		}
		//check constraints
		if ( typeof node.data.constraint !== 'undefined') {
			$.each(node.data.constraint, function(index, result) {
				if (result["id"] == data.id)
					aId = result["aId"];
			});
		}

		//if not available
		if ( typeof aId === 'undefined') {
			st.graph.eachBFS('0', function(n) {
				if ( typeof n.data.output !== 'undefined') {
					$.each(n.data.output, function(index, result) {
						idArr.push(result["aId"]);
					});
				}
				if ( typeof n.data.constraint !== 'undefined') {
					$.each(n.data.constraint, function(index, result) {
						idArr.push(result["aId"]);
					});
				}
			});

			if (idArr.length != 0) {
				for (var i = 1; i <= idArr.length; i++) {
					if (idArr.indexOf("a" + i) < 0) {
						aId = "a" + i;
						break;
					}
					aId = "a" + (idArr.length + 1);
				}
			} else {
				aId = "a" + 1;
			}
		}

		return aId;
	}
	//add output to the graph structure
	this.addAttr = function(data, stk) {
		var anode = st.graph.getNode(activeNode);
		var rmIndx;

		//push it into stack
		if (stk != 'noStack') {
			stack.push('attributeAdded', data);
		}

		//tree.assignAId(data);
		data.aId = tree.assignAId(anode, data);
		data.hId = tree.var_rep(data.name) + "_" + data.aId;

		//check if output object exist for the node
		if ( typeof anode.data.output === 'undefined') {
			var output = new Array();
			anode.data.output = output;
		} else {
			$.each(anode.data.output, function(index, result) {
				if (result['id'] == data.id) {
					rmIndx = index;
				}
			});
			//Remove from array
			if ( typeof rmIndx !== 'undefined')
				anode.data.output.splice(rmIndx, 1);
		}
		anode.data.output.push(data);
		tree.addLabelAttr(data, 'o');
		//save draft
		informChange("noReExecuteQuery", "saveDraft");
	}
	//return query graph in json
	this.getQueryGraph = function() {
		return st.toJSON('graph');
	}
	//remove output from the graph structure
	this.removeAttr = function(data, stk) {
		var anode = st.graph.getNode(activeNode);
		var hnode = st.graph.getNode('0');
		var aId;
		var dt = new Object();
		var rmIndx;

		if ( typeof anode.data.output !== 'undefined') {
			$.each(anode.data.output, function(index, result) {
				if (result['id'] == data.id) {
					aId = result["aId"];
					rmIndx = index;
				}
			});
			//Remove from array
			anode.data.output.splice(rmIndx, 1);
		}

		// remove sequence data
		var r = (hnode.data.sequence.vr == hnode.data.aggregate.vra) ? hnode.data.aggregate.vr : "";
		if (hnode.data.sequence.vr == aId || aId == r) {
			dt.seq = hnode.data.sequence;
			hnode.data.sequence = {};
		}
		// remove aggregate data
		if (hnode.data.aggregate.vr == aId) {
			dt.agg = hnode.data.aggregate;
			hnode.data.aggregate = {};
		}
		// remove stream data
		if ( typeof hnode.data.temporal !== "undefined") {
			if (hnode.data.temporal.op.vr == aId) {
				dt.stOp = hnode.data.temporal.op;
				hnode.data.temporal.op = {};
			}
		}

		data.aId = aId;
		tree.removeLabelAttr(data, 'o');

		dt.attr = data;
		//push it into stack
		if (stk != 'noStack') {
			stack.push('attributeRemoved', dt);
		}

		//save draft
		informChange("noReExecuteQuery", "saveDraft");
	}
	this.deliverEvent = function(nodeId, type) {
		var node = st.graph.getNode(nodeId);
		var knode = st.graph.getNode(0);
		Channel.ClearMessage();
		Channel.message.type = type;
		Channel.message.content = new Object();
		//set message content
		if (type == 'nodeAdded' || type == 'nodeSelected') {
			Channel.message.content.nodeId = nodeId;
			Channel.message.content.conceptId = node.data.id;
			Channel.message.content.conceptLabel = node.data.label;
			Channel.message.content.conceptName = node.data.name;
			Channel.message.content.conceptNs = node.data.ns;
			Channel.message.content.output = ( typeof node.data.output == "undefined" ? "" : node.data.output);
			Channel.message.content.constraint = ( typeof node.data.constraint == "undefined" ? "" : node.data.constraint);
		} else if (type == 'confirm') {
			Channel.message.content.bck = "deleteConfirmed";
			if (nodeId == '0')
				Channel.message.content.mss = "All query will be deleted?";
			else
				Channel.message.content.mss = node.data.label + " node will be deleted?";
		} else if (type == 'resultViewComplete') {
			//no content
		} else if (type == 'executeQuery' || type == 'reExecuteQuery') {
			var SparqlObj = tree.toSparqlObj();
			if (SparqlObj.isStreaming()) {
				Channel.message.content.qtype = "temporal";
				Channel.message.content.query = tree.getStarql(SparqlObj);
				Channel.message.content.sequence = knode.data.sequence;
				Channel.message.content.aggregate = knode.data.aggregate;
				if ( typeof knode.data.temporal.op !== "undefined")
					Channel.message.content.streamop = knode.data.temporal.op;
				Channel.message.content.output = tree.getOutputVars();
				Channel.message.content.longids = Qconfig.longids;
				Channel.message.content.example = Qconfig.example;
			} else {
				Channel.message.content.qtype = "plain";
				Channel.message.content.query = tree.getSparql(SparqlObj);
				Channel.message.content.sequence = knode.data.sequence;
				Channel.message.content.aggregate = knode.data.aggregate;
				Channel.message.content.output = tree.getOutputVars();
				Channel.message.content.longids = Qconfig.longids;
				Channel.message.content.example = Qconfig.example;

			}
		} else if (type == 'info') {
			Channel.message.content.mss = nodeId;
		} else if (type == 'temporal') {
			Channel.message.content = tree.getAttr(0, "temporal");
		} else if (type == 'Qconfig') {
			Channel.message.content = Qconfig;
		}

		Channel.Send('parent');
	}
}
