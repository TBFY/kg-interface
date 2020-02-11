//global variables
var pages = new Array();

$(document).ready(function() {
	//cache false
	$.ajaxSetup({
		cache : false
	});
	
	mQbN = new MQbN();
	//attach option click event
	$('body').on('click', '.option', function(event) {
		mQbN.deliverEvent('conceptSelected', $(this));
	});
	//attach home click event
	$('body').on('click', '.home-btn', function(event) {
		mQbN.getPage(0, 'Please select a concept', 'slide');
	});
});

//MQbN object
function MQbN() {
	this.assignPageId = assignPageId;
	this.getDefaultImage = getDefaultImage;
	this.createPage = createPage;
	this.changePage = changePage;
	this.loadPage = loadPage;
	this.listOptions = listOptions;
	this.deliverEvent = deliverEvent;
	this.getPage = getPage;
}

//get page
function getPage(conceptId, title) {
	var id = mQbN.assignPageId(conceptId);

	if (!$('#' + id).length) {
		mQbN.createPage(id, title, false, false);
		dataModel.getConcepts(conceptId, id, false);
	} else {
		dataModel.getConcepts(conceptId, id, true);
	}
}

//assign a unique page id
function assignPageId(uri) {
	var indx;
	//check if page already exists
	if (pages.indexOf(uri) >= 0) {
		indx = pages.indexOf(uri);
	} else {
		indx = pages.length;
		pages[pages.length] = uri;
	}

	return indx;
}

//get the default icon
function getDefaultImage() {
	var base;

	if (window.location.protocol == 'http:' || window.location.protocol == 'https:')
		base = window.location.protocol + '//' + window.location.host + window.location.pathname.replace('index.html', '');
	else
		base = window.location.host + window.location.pathname.replace('index.html', '');

	return base + "images/gear.png"
}

//create the page
function createPage(id, title, bck, home) {
	var content;
	var pageId;

	//prepare page
	content = '<div data-add-back-btn="' + bck + '" data-url="n" data-role="page" id="' + id + '" class="page" data-dom-cache="false">';
	content += '<div data-role="header" data-id="myheader" data-position="fixed" data-tap-toggle="false"><h1>' + (title == 'Untitled query' ? 'Please choose' : title) + '</h1>';
	if (home)
		content += '<a href="#" data-icon="home" class="ui-btn-right home-btn">Home</a>';
	content += '</div>';
	content += '<div data-role="content">';
	content += '<div id="search-wrapper">';
	content += '<ul data-role="listview" id="ul_' + id + '" data-inset="true" data-theme="c" data-divider-theme="c" data-filter="true" data-filter-placeholder="Search...">';
	content += '</ul>';
	content += '</div>';
	content += '</div>';
	content += '</div>';
	content = $(content);
	
	//append it to the page container
	content.appendTo($.mobile.pageContainer);
}

//load page
function loadPage(id, result, reCreate) {
	var content = '';

	content = mQbN.listOptions(result);
	content = $(content);

	$('#ul_' + id + ' li').remove();
	content.appendTo('#ul_' + id);

	if (reCreate) {
		$('#ul_' + id).trigger("create");
		$('#ul_' + id).listview('refresh');
		$('#ul_' + id).show();
	}
}

// return default image
function imgError(image) {
    image.onerror = "";
    image.src = "../../icons/gear.png";
    return true;
}

//change page
function changePage(id, trans) {
	// go to it
	$.mobile.changePage("#" + id, {
		transition : trans
	});
}

//get the list of options
function listOptions(result) {
	var content = '';

	for (var i = 0; i < result.options.length; i++) {

		// remove later
		var str = "";
		var str2 = "";
		if ( typeof result.options[i].prop != "undefined") {
			if (result.options[i].prop.ext == "temporal") {
				str = 'data-theme="b"';
				str2 = 'propAnnt="stream"';
			}
		}

		//console.log(result.options);
		content += '<li class="option" id="' + result.options[i].id + '" conceptName ="' + result.options[i].name + '" conceptNs ="' + result.options[i].ns + '"' + str + '>';
		content += '<a href="#"><img src="../../icons/' + result.options[i].label.replace(/ /g,'') + '.png" onerror="imgError(this);">';
		content += '<h2 conceptLabel="' + result.options[i].label + '">' + result.options[i].label + '</h2>';
		content += '<p propId="' + ( typeof result.options[i].prop == "undefined" ? "" : result.options[i].prop.id) + '"';
		content += ' propName="' + ( typeof result.options[i].prop == "undefined" ? "" : result.options[i].prop.name) + '"';
		content += ' propLabel="' + ( typeof result.options[i].prop == "undefined" ? "" : result.options[i].prop.label) + '"';
		content += ' propNs="' + ( typeof result.options[i].prop == "undefined" ? "" : result.options[i].prop.ns) + '"';
		content += ' ' + str2 + '>';
		content += ( typeof result.options[i].prop == "undefined" ? result.options[i].desc : result.options[i].prop.desc) + '</p>';

		content += '</a>';
		content += '</li>';
	}

	return content;
}

//prepare and deliver events
function deliverEvent(type, source) {
	Channel.ClearMessage();

	//set message content
	Channel.message.type = type;
	Channel.message.content = new Object();
	Channel.message.content.concept = new Object();
	Channel.message.content.prop = new Object();
	Channel.message.content.concept.id = source.attr('id');
	Channel.message.content.concept.name = source.attr('conceptName');
	Channel.message.content.concept.label = source.find('h2').attr('conceptLabel');
	Channel.message.content.concept.ns = source.attr('conceptNs');
	Channel.message.content.concept.icon = source.find('img').attr('src');
	Channel.message.content.prop.id = source.find('p').attr('propId');
	Channel.message.content.prop.name = source.find('p').attr('propName');
	Channel.message.content.prop.label = source.find('p').attr('proplabel');
	Channel.message.content.prop.ns = source.find('p').attr('propNs');
	Channel.message.content.prop.annt = source.find('p').attr('propAnnt');
	//send the message
	Channel.Send('parent');
}
