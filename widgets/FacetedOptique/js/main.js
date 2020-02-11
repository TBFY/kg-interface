var facet_id = 0;
var concept = new Object();
var attrId = new Array();

// experiment stuff
var exp;

$(document).ready(function() {
	//cache false
	$.ajaxSetup({
		cache : false
	});

	Facet = new facet();
	var rSld1 = "";
	var rSld2 = "";
	var dt1 = "";
	var dt2 = "";

	// experiment stuff
	exp = getURLParameter($(parent.location).attr('href'), "exp");

	//call geoLocation widget
	$('body').on('click', '.geoLocation', function(event) {
		Facet.deliverEvent($(this), 'geoLocation');
	});

	//call temporal widget
	$('body').on('click', '.temporal', function(event) {
		Facet.deliverEvent($(this), 'temporal');
	});

	//add attribute to output
	$('body').on('click', '.add', function(event) {
		Facet.deliverEvent($(this), 'attributeAdded');
		// update icon to minus
		$(this).attr('data-icon', 'remove');
		$(this).children().children().next().removeClass('ui-icon-add').addClass('ui-icon-remove');
		$(this).removeClass('add');
		$(this).addClass('remove');

		moveUp($(this).closest('li'), 'output');

	});

	//remove attribute from the output
	$('body').on('click', '.remove', function(event) {
		Facet.deliverEvent($(this), 'attributeRemoved');
		// update icon to plus
		$(this).attr('data-icon', 'add');
		$(this).children().children().next().removeClass('ui-icon-remove').addClass('ui-icon-add');
		$(this).removeClass('remove');
		$(this).addClass('add');

		moveDown($(this).closest('li'), 'output');

	});

	//hook auto-complete for all text-fields
	//also constraint management for text fields
	$('body').on('change', ':text', function(event) {
		if ($(this).attr('data-type') != 'search') {
			//dummy data for all fields
			var availableTags = ["Statoil Petroleum AS", "Stolt Offshore A/S", "Songa Offshore ASA", "Spectrum ASA", "Superior Oil Norge A/S"];
			$(this).autocomplete({
				source : availableTags
			});
			if (event.target.defaultValue == event.target.value) {
				Facet.deliverEvent($(event.target), 'constraintRemoved');
				moveDown($(event.target).closest('li'), 'constraint');
			} else {
				Facet.deliverEvent($(event.target), 'attributeConstrained');
				moveUp($(event.target).closest('li'), 'constraint');
			}
		}
	});

	//for dual range sliders: when you use sliders
	$('body').on('slidestop', function(event) {
		var element = $(event.target);
		var oId = element.closest('li').attr('attrAId');
		var element_1;
		var element_2;

		//dual range slider
		if (element.attr('name') == 'rangeSlider') {
			element_1 = $('#' + oId + '_1');
			element_2 = $('#' + oId + '_2');

			if (element_1.prop('defaultValue') == element_1.val() && element_2.prop('defaultValue') == element_2.val()) {
				Facet.deliverEvent(element, 'constraintRemoved');
				moveDown(element.closest('li'), 'constraint');
			} else {
				Facet.deliverEvent(element, 'attributeConstrained');
				moveUp(element.closest('li'), 'constraint');
			}
		}
	});
	//for dual range sliders: to store focus value
	$('body').on('focus', 'input', function(event) {
		var element = $(event.target);
		//console.log(element);
		if (element.attr('name') == 'rangeSlider') {
			var oId = element.closest('li').attr('attrAId');
			var element_1 = $('#' + oId + '_1');
			var element_2 = $('#' + oId + '_2');

			rSld1 = element_1.val();
			rSld2 = element_2.val();

		} else if (element.attr('name') == 'date-range') {
			var oId = element.closest('li').attr('attrAId');
			var element_1 = $('#' + oId + '_1');
			var element_2 = $('#' + oId + '_2');

			dt1 = element_1.val();
			dt2 = element_2.val();
		}
	});
	//for range sliders manual editing - check first if there is
	//really a change by looking at on focus values
	$('body').on('blur', 'input', function(event) {
		var element = $(event.target);
		//console.log(element);
		if (element.attr('name') == 'rangeSlider') {
			var oId = element.closest('li').attr('attrAId');
			var element_1 = $('#' + oId + '_1');
			var element_2 = $('#' + oId + '_2');
			if (rSld1 != element_1.val() || rSld2 != element_2.val()) {
				if (element_1.prop('defaultValue') == element_1.val() && element_2.prop('defaultValue') == element_2.val()) {
					Facet.deliverEvent(element, 'constraintRemoved');
					moveDown(element.closest('li'), 'constraint');
				} else {
					Facet.deliverEvent(element, 'attributeConstrained');
					moveUp(element.closest('li'), 'constraint');
				}
			}
		} else if (element.attr('name') == 'date-range') {
			var oId = element.closest('li').attr('attrAId');
			var element_1 = $('#' + oId + '_1');
			var element_2 = $('#' + oId + '_2');

			if (dt1 != element_1.val() || dt2 != element_2.val()) {
				if (element_1.prop('defaultValue') == element_1.val() && element_2.prop('defaultValue') == element_2.val()) {
					Facet.deliverEvent(element, 'constraintRemoved');
					moveDown(element.closest('li'), 'constraint');
				} else {
					Facet.deliverEvent(element, 'attributeConstrained');
					moveUp(element.closest('li'), 'constraint');
				}
			}

		}
	});

	//add-remove constrained for single select and subclass:multi-select
	//cannot use for dual range sliders for manual editing, since the
	//event gets fired also when you slide. This causes a lot of constraint
	//added event -- problematic for undo and redo.
	$('body').on('change', '', function(event) {
		var element = $(event.target);
		//single select-list
		if (element.attr('name') == 'select-one') {
			if (element.val().toLowerCase() == 'any') {
				Facet.deliverEvent(element, 'constraintRemoved');
				moveDown(element.closest('li'), 'constraint');
			} else {
				Facet.deliverEvent(element, 'attributeConstrained');
				moveUp(element.closest('li'), 'constraint');
			}
			//subclass
		} else if (element.attr('name') == 'subclass') {
			if (element.val()) {
				Facet.deliverEvent(element, 'attributeConstrained');
				moveUp(element.closest('li'), 'constraint');
			} else {
				Facet.deliverEvent(element, 'constraintRemoved');
				moveDown(element.closest('li'), 'constraint');
			}
		}
	});

});
//set output
function setOutput(output) {
	var aId;

	aId = Facet.getAttrId(output.id);
	//aId = $("#ul_"+facet_id).find('li[attrId="'+output.id+'"]')[0].getAttribute("attrAId");

	$("#btn_" + aId).attr('data-icon', 'remove');
	$("#btn_" + aId).children().children().next().removeClass('ui-icon-add').addClass('ui-icon-remove');
	$("#btn_" + aId).removeClass('add');
	$("#btn_" + aId).addClass('remove');

	moveUp($("#btn_" + aId).closest('li'), 'output');

}

//set constraint
function setConstraint(constraint) {
	var aId;

	aId = Facet.getAttrId(constraint.id);
	//aId = $("#ul_"+facet_id).find('li[attrId="'+constraint.id+'"]')[0].getAttribute("attrAId");

	if ($("#" + aId).attr("name") == "text") {
		$("#" + aId).val(constraint.constr);
	} else if (constraint.constrType == "greater") {
		$("#" + aId + "_1").val(constraint.constrHigh);
		$("#" + aId + "_1").slider("refresh");
	} else if (constraint.constrType == "lower") {
		$("#" + aId + "_2").val(constraint.constrLow);
		$("#" + aId + "_2").slider("refresh");
	} else if (constraint.constrType == "range") {
		$("#" + aId + "_1").val(constraint.constrHigh);
		$("#" + aId + "_2").val(constraint.constrLow);
		$("#" + aId + "_1").slider("refresh");
		$("#" + aId + "_2").slider("refresh");
	} else if ($("#" + aId).attr("name") == "select-one") {
		$('#' + aId).val(constraint.constr);
		$("#" + aId).selectmenu('refresh');
	} else if ($("#" + aId).attr("name") == "subclass") {
		var opts = constraint.type;
		var opArr = new Array();

		for (var i = 0; i < opts.length; i++) {
			opArr.push(opts[i].id);
		}
		$('#' + aId).val(opArr);
		$("#" + aId).selectmenu('refresh');
	}

	moveUp($("#" + aId).closest('li'), 'constraint');

}

//get id of an attribute
function getAttrId(oId) {
	var aId;

	aId = $("#ul_"+facet_id).find('li[attrId="'+oId+'"]')[0].getAttribute("attrAId");

	return aId;
}

//fill form elements
function sortPage(output, constraint) {
	var aId;

	for ( i = 0; i < output.length; i++) {
		Facet.setOutput(output[i]);
	}

	for ( i = 0; i < constraint.length; i++) {
		Facet.setConstraint(constraint[i]);
	}
}

function facet() {
	this.createPage = createPage;
	this.loadPage = loadPage;
	this.getPage = getPage;
	this.changePage = changePage;
	this.formField = formField;
	this.sortPage = sortPage;
	this.setOutput = setOutput;
	this.getAttrId = getAttrId;
	this.setConstraint = setConstraint;
	this.assignAttrId = assignAttrId;
	this.deliverEvent = deliverEvent;
	this.addExt = addExt;
}

// add extrnal data to
// attribute, possibly coming from
//other widgets, e.g., map
function addExt(id, ext, origin) {
	var aId;
	var content = "";

	aId = getAttrId(id);

	if ($('#ext_' + aId + '[origin="' + origin + '"]').length)
		$('#ext_' + aId + '[origin="' + origin + '"]').remove();

	content = '<span id="ext_' + aId + '" origin="' + origin + '">';
	$.each(ext, function(key, value) {
		content += '<span key="' + key + '" value="' + value + '"></span>';
	});
	content += '</span>';

	$("#li_" + aId).append(content);
}

//hash function
String.prototype.hashCode = function() {
	var hash = 0, i, char;
	if (this.length == 0)
		return hash;
	for ( i = 0, l = this.length; i < l; i++) {
		char = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash |= 0;
		// Convert to 32bit integer
	}
	return hash;
};

//assign a unique attribute id
function assignAttrId(fctId, attrUri) {
	var id;
	//id = attrUri.hashCode()+'_'+fctId
	if ( typeof attrId[fctId] === 'undefined') {
		attrId[fctId] = new Array();
		attrId[fctId].push(attrUri);
		id = 'a0' + '_' + fctId;
	} else {
		if (attrId[fctId].indexOf(attrUri) >= 0) {
			id = 'a' + attrId[fctId].indexOf(attrUri) + '_' + fctId;
		} else {
			attrId[fctId].push(attrUri);
			id = 'a' + attrId[fctId].length + '_' + fctId;
		}

	}
	return id;
}

//get the page
function getPage(data) {
	concept = data.content;
	if (!$('#' + data.content.nodeId).length) {
		Facet.createPage(data.content.nodeId, data.content.conceptLabel, false, false);
		dataModel.getFields(data.content, false);
	} else {
		dataModel.getFields(data.content, true);
		$('#' + data.content.nodeId).find("h1").html(data.content.conceptLabel);
	}
}

//load page
function loadPage(id, result, reCreate) {
	var result;
	var content = '';

	for ( var i = 0; i < result.fields.length; i++) {
		content += formField(id, result.fields[i]);
	}

	content = $(content);
	$('#ul_' + id + ' li').remove();
	content.appendTo('#ul_' + id);

	if (reCreate) {
		$('#ul_' + id).trigger("create");
		$('#ul_' + id).listview().listview('refresh');
		$('#ul_' + id).show();
	}
}

//change page
function changePage(id, trans) {
	facet_id = id;
	// go to it
	$.mobile.changePage("#" + id, {
		transition : trans
	});
}

//create page
function createPage(id, title, bck, home) {
	var content = '';

	//prepare page
	content = '<div data-add-back-btn="' + bck + '" data-url="n" data-role="page" id="' + id + '" class="page" data-dom-cache="false">';
	content += '<div data-role="header" data-id="myheader" data-position="fixed" data-tap-toggle="false"><h1>' + title + ' information</h1>';
	if (home)
		content += '<a href="#" data-icon="home" class="ui-btn-right home-btn">Home</a>';
	content += '</div>';
	content += '<div data-role="content">';
	content += '<ul data-role="listview" id="ul_' + id + '" data-inset="true" data-theme="c" data-filter="true" data-filter-placeholder="Search..." data-mini="true">';
	content += '</ul>';
	content += '</div>';
	content += '</div>';
	content = $(content);

	//append it to the page container
	content.appendTo($.mobile.pageContainer);
}

function formField(fctId, params) {
	var field = '';
	var aId = assignAttrId(fctId, params.id);
	var str = "";

	if (params.ext == "temporal")
		str = 'attrAnnt="stream" data-theme="b"';

	// data-role="fieldcontain"
	field += '<li id="li_' + aId + '" attrNs="' + params.ns + '" attrName="' + params.name + '" attrAId= "' + aId + '" attrId="' + params.id + '" attrType="' + params.type + '" attrLabel="' + params.label + '" ' + str + '>';

	//text field
	if (params.inputType == 'text') {
		field += '<label for="' + aId + '" >';
		//field += '<a href="#"><img src="http://simpleicon.com/wp-content/uploads/current-location.svg" style="position:absolute; z-index: 2;right:15px;height: 32px;width: 32px;"></img></a>';

		// bind widgets
		if (params.ext == 'geoLocation') {
			field += '<a href="#" data-role="button" name="location" data-icon="geoLocation" data-iconpos="notext" data-theme="c" data-inline="true" class="' + params.ext + '" style="float:right;" id="geo_' + aId + '">Map</a>';
		}

		field += '<a href="#" data-role="button" data-icon="add" data-iconpos="notext" data-theme="c" data-inline="true" class="add" id="btn_' + aId + '">Output</a>' + params.label + '</label>';
		field += '<input type="text" name="text" id="' + aId + '" value="" data-clear-btn="true"/>';
	} else if (params.inputType == 'rangeSlider') {
		field += '<div data-role="rangeslider">';
		field += '<label for="' + aId + '_1' + '">';
		field += '<a href="#" data-role="button" data-icon="add" data-iconpos="notext" data-theme="c" data-inline="true" class="add" id="btn_' + aId + '">Output</a>' + params.label + '</label>';
		field += '<label for="' + aId + '_2' + '">' + params.label + '</label>';
		field += '<input type="range" name="rangeSlider" id="' + aId + '_1' + '" step="' + params.option.stepValue + '" min="' + params.option.minInclusive + '" max="' + params.option.maxInclusive + '" value="' + params.option.minInclusive + '">';
		field += '<input type="range" name="rangeSlider" id="' + aId + '_2' + '" step="' + params.option.stepValue + '" min="' + params.option.minInclusive + '" max="' + params.option.maxInclusive + '" value="' + params.option.maxInclusive + '">';
		field += '</div>';
	} else if (params.inputType == 'select') {
		field += '<label for="' + aId + '">';

		// bind widgets
		if ( typeof params.ext !== 'undefined') {
			// experiment stuff
			if (exp == "false")
				field += '<a href="#" data-role="button" name="location" data-icon="geoLocation" data-iconpos="notext" data-theme="c" data-inline="true" class="' + params.ext + '" style="float:right;" id="geo_' + aId + '">Map</a>';
		}

		field += '<a href="#" data-role="button" data-icon="add" data-iconpos="notext" data-theme="c" data-inline="true" class="add" id="btn_' + aId + '">Output</a>' + params.label + '</label>';
		field += '<select name="select-one" id="' + aId + '">';
		field += '<option value="Any">Any</option>';
		for (var i = 0; i < Object.keys(params.option).length; i++)
			field += '<option value="' + params.option[i] + '">' + params.option[i] + '</option>';
		field += '</select>';
	} else if (params.inputType == 'date-range') {
		field += '<label for="' + aId + '_1" >';
		field += '<a href="#" data-role="button" data-icon="add" data-iconpos="notext" data-theme="c" data-inline="true" class="add" id="btn_' + aId + '">Output</a>' + params.label + '</label>';
		field += '<input type="datetime-local" name="date-range" id="' + aId + '_1" value="">';
		field += '<input type="datetime-local" name="date-range" id="' + aId + '_2" value="">';
	} else if (params.inputType == 'subclass') {
		field += '<label for="' + aId + '" class="select">';
		field += '<a href="#" data-role="button" data-icon="add" data-iconpos="notext" data-theme="c" data-inline="true" class="add" id="btn_' + aId + '">Output</a>' + params.label + '</label>';
		field += '<select name="subclass" id="' + aId + '" multiple="multiple" data-native-menu="false" data-icon="grid" data-iconpos="left">'
		field += '<option>Please select</option>';
		for (var i = 0; i < params.options.length; i++)
			field += '<option name="' + params.options[i].name + '" ns="' + params.options[i].ns + '" desc="' + params.options[i].desc + '" value="' + params.options[i].id + '">' + params.options[i].label + '</option>';
		field += '</select>';
	}

	field += '</li>';

	return field;
}

function deliverEvent(source, type) {
	Channel.ClearMessage();
	Channel.message.type = type;
	Channel.message.content = new Object();
	Channel.message.content.attr = new Object();
	Channel.message.type = type;

	//extract common message content
	Channel.message.content.attr.id = source.closest('li').attr('attrId');
	//Channel.message.content.attr.aId = source.closest('li').attr('attrAId');
	Channel.message.content.attr.name = source.closest('li').attr('attrName');
	Channel.message.content.attr.ns = source.closest('li').attr('attrNs');
	Channel.message.content.attr.label = source.closest('li').attr('attrLabel');
	Channel.message.content.attr.type = source.closest('li').attr('attrType');
	Channel.message.content.attr.annt = source.closest('li').attr('attrAnnt');

	if (type == 'attributeConstrained') {
		//text field
		if (source.attr("name") == "text") {
			Channel.message.content.attr.constr = source.val();
			Channel.message.content.attr.constrType = 'eq';
			//dual range slider
		} else if (source.attr('name') == 'rangeSlider') {
			var element_1 = $('#' + source.closest('li').attr('attrAId') + '_1');
			var element_2 = $('#' + source.closest('li').attr('attrAId') + '_2');

			if (element_1.val() == element_2.val()) {
				Channel.message.content.attr.constr = source.val();
				Channel.message.content.attr.constrType = 'eq';
			} else if (element_1.prop('defaultValue') != element_1.val() && element_2.prop('defaultValue') != element_2.val()) {
				Channel.message.content.attr.constrHigh = element_1.val();
				Channel.message.content.attr.constrLow = element_2.val();
				Channel.message.content.attr.constrType = 'range';
			} else if (element_1.prop('defaultValue') != element_1.val()) {
				Channel.message.content.attr.constrHigh = source.val();
				Channel.message.content.attr.constrType = 'greater';
			} else if (element_2.prop('defaultValue') != element_2.val()) {
				Channel.message.content.attr.constrLow = element_2.val();
				Channel.message.content.attr.constrType = 'lower';
			}
		} else if (source.attr("name") == "date-range") {
			var element_1 = $('#' + source.closest('li').attr('attrAId') + '_1');
			var element_2 = $('#' + source.closest('li').attr('attrAId') + '_2');

			if (element_1.val() == element_2.val()) {
				Channel.message.content.attr.constr = source.val();
				Channel.message.content.attr.constrType = 'eq';
			} else if (element_1.prop('defaultValue') != element_1.val() && element_2.prop('defaultValue') != element_2.val()) {
				Channel.message.content.attr.constrHigh = element_1.val();
				Channel.message.content.attr.constrLow = element_2.val();
				Channel.message.content.attr.constrType = 'range';
			} else if (element_1.prop('defaultValue') != element_1.val()) {
				Channel.message.content.attr.constrHigh = source.val();
				Channel.message.content.attr.constrType = 'greater';
			} else if (element_2.prop('defaultValue') != element_2.val()) {
				Channel.message.content.attr.constrLow = element_2.val();
				Channel.message.content.attr.constrType = 'lower';
			}
		} else if (source.attr("name") == "select-one") {
			Channel.message.content.attr.constr = $('#' + source.attr('id') + " option[value='" + source.val() + "']").text();
			Channel.message.content.attr.constrType = 'eq';
		} else if (source.attr("name") == "subclass") {
			Channel.message.content.attr.type = new Array();
			for (var i = 0; i < $('option:selected', source).length; i++) {
				var slct = $('option:selected', source)[i];
				var typObj = new Object();
				slct = $(slct);

				typObj.id = slct.val();
				typObj.name = slct.attr("name");
				typObj.ns = slct.attr("ns");
				typObj.label = slct.text();
				typObj.desc = slct.attr("desc");

				Channel.message.content.attr.type.push(typObj);
			}
		}

		//gather external data from other widgets, e.g., map
		if ($('#ext_' + source.closest('li').attr('attraId')).length) {
			Channel.message.content.attr.ext = new Object();
			Channel.message.content.attr.ext.origin = $('#ext_' + source.closest('li').attr('attraId')).attr("origin");
			$('#ext_' + source.closest('li').attr('attraId')).children('span').each(function() {
				Channel.message.content.attr.ext[$(this).attr('key')] = $(this).attr('value');
			});
		}
		/* If previously entered when temporal widget is called initialize with data
		 * If previously entered focus map widget to location
		 * Allow removal
		 * enable readdition from the graph call
		 * what happens if I don't enter any constraint but simply temporal
		 * what happens if I first enter constraint than temporal
		 */

	} else if (type == 'geoLocation') {
		Channel.message.content.nodeId = concept.nodeId;
		Channel.message.content.conceptId = concept.conceptId;
		Channel.message.content.conceptName = concept.conceptName;
		Channel.message.content.conceptLabel = concept.conceptLabel;
		Channel.message.content.conceptNs = concept.conceptNs;
	}
	Channel.Send('parent');
}
