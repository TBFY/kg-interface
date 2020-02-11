function event() {
	this.addlistener = addlistener;
}

function addlistener() {
	var onmessage = function(e) {
		var data = new Object();
		data = JSON.parse(e.data);
		var origin = e.origin;

		if (data.type == 'conceptSelected') {
			//only one root concept
			if (activeNode == '0' && !tree.isLeaf('0')) {
				tree.changeActiveNode('0', 'nodeSelected', 'noStack');
			} else {
				tree.addNode('', data.content, 'stack', 'active');
			}
		} else if (data.type == 'deleteConfirmed') {
			tree.removeNode(nodeToDelete, 'stack');
		} else if (data.type == 'attributeAdded') {
			tree.addAttr(data.content.attr, 'stack');
		} else if (data.type == 'attributeRemoved') {
			tree.removeAttr(data.content.attr, 'stack');
		} else if (data.type == 'attributeConstrained') {
			tree.addConstraint(data.content.attr, 'stack');
		} else if (data.type == 'constraintRemoved') {
			tree.removeConstraint(data.content.attr, 'stack');
		} else if (data.type == "sequence") {
			tree.updateSequence(data.content, 'stack');
		} else if(data.type == "aggregate") {
			tree.updateAggregate(data.content, 'stack');
		} else if(data.type == "stream_op"){
			tree.updateStreamOp(data.content, 'stack');
		} else if(data.type == "temporal"){
			tree.updateTimeWindow(data.content);
		} else if(data.type == "Qconfig"){
			tree.updateQConfig(data.content);
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
