function Stack() {
	this.undoArr = new Array();
	this.redoArr = new Array;
	//methods
	this.push = push;
	this.undo = undo;
	this.redo = redo;
	this.clear = clear;
}

//push a new graph in
function push(type, c) {
	var command = new Object();
	command.type = type;
	command.content = c;

	if (stack.undoArr.length == 10) {
		stack.undoArr.shift();
	}
	stack.redoArr = [];
	stack.undoArr.push(command);
}

//undo
function undo() {
	var uC;
	
	if (stack.undoArr.length != 0) {
		uC = stack.undoArr.pop();
		if (stack.redoArr.length == 10) {
			stack.redoArr.shift();
		}
		stack.redoArr.push(uC);
	} else {
		uC = "";
	}
	
	return uC;
}

//redo
function redo() {
	var rC;

	if (stack.redoArr.length != 0) {
		rC = stack.redoArr.pop();
		if (stack.undoArr.length == 10) {
			stack.undoArr.shift();
		}
		stack.undoArr.push(rC);
	} else {
		rC = "";
	}

	return rC;
}
//clear
function clear() {
	stack.redoArr = [];
	stack.undoArr = [];
}

stack = new Stack();
