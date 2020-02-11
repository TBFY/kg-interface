function event() {
	this.addlistener = addlistener;
}

function addlistener() {
	var onmessage = function(e) {
		var data = new Object();
		data = JSON.parse(e.data);
		var origin = e.origin;
		var source = e.source;

		if (data.type == 'nodeAdded' || data.type == 'nodeSelected') {
			getPage(data);
		} else if (data.type == 'instanceSelected') {
			Facet.setConstraint(data.content.constraint);
			Facet.deliverEvent($("#" + Facet.getAttrId(data.content.constraint.id)), "attributeConstrained");
		} else if(data.type == 'temporal'){
			Facet.addExt(data.content.attr.id, data.content.ext, "temporal");
		}

	};

	if ( typeof window.addEventListener != 'undefined') {
		window.addEventListener('message', onmessage, false);
	} else if ( typeof window.attachEvent != 'undefined') {
		window.attachEvent('onmessage', onmessage);
	}
}

Event = new event();
Event.addlistener();
