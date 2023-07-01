const terminal_kit = require('terminal-kit')
const url = require('url')

const utils = require('./ServerUtils.js')

var term = null;
var violators = null;
var csproData = null;
var cspro = null;

var callback = null;

const STATES = {
	menu: 1,
	hosts: 2,
	paths: 3
}
var state = STATES.menu
var selectedDirective = utils.csp_directives[0]
var selectedHost = ''

var cursor = {
	'1': {y: 0}
};

function draw_menu(){
	var table = [[ 'csp directive' , 'websites' ]]
	for (var k in violators){
		table.push([k, Object.keys(violators[k]).join(' ')])
	}
	table[cursor[STATES.menu].y+1][0] = '^!' + table[cursor[STATES.menu].y+1][0]
	term.table( table , {
			hasBorder: false ,
			contentHasMarkup: true ,
			textAttr: { bgColor: 'default' } ,
			// firstCellTextAttr: { bgColor: 'blue' } ,
			// firstRowTextAttr: { bgColor: 'yellow' } ,
			firstRowTextAttr: { color: 'yellow' , inverse: true} ,
			firstColumnTextAttr: { color: 'yellow' } ,
			checkerEvenCellTextAttr: { bgColor: 'gray' } ,
			width: term.width ,
			fit: false 
		}
	) ;
	console.log(csproData)
	console.log(cspro)
}

function draw_violator(){
	var table = [[ '  ', selectedDirective ]];
	for (const v of Object.keys(violators[selectedDirective])){
		if (csproData[selectedDirective] &&
			csproData[selectedDirective].includes(v)){
			table.push(['  ', '^G' + v])
		} else {
			table.push(['  ', '^R' + v])
		}
	}
	table[cursor[STATES.hosts].y+1][0] = '^!' + table[cursor[STATES.hosts].y+1][0]
	term.table( table , {
			hasBorder: false ,
			contentHasMarkup: true ,
			textAttr: { bgColor: 'default' } ,
			// firstCellTextAttr: { bgColor: 'blue' } ,
			// firstRowTextAttr: { bgColor: 'yellow' } ,
			firstRowTextAttr: { color: 'yellow' , inverse: true} ,
			// firstColumnTextAttr: { color: 'yellow' } ,
			// checkerEvenCellTextAttr: { bgColor: 'gray' } ,
			width: term.width ,
			height: term.height,
			fit: false 
		}
	) ;
}

function draw_violator_paths(){
	var table = [[ '  ', selectedDirective + ': ' + selectedHost ]];
	for (const u of Object.keys(violators[selectedDirective][selectedHost])){
		table.push(['  ', u])
	}
	term.table( table , {
			hasBorder: false ,
			contentHasMarkup: true ,
			textAttr: { bgColor: 'default' } ,
			// firstCellTextAttr: { bgColor: 'blue' } ,
			// firstRowTextAttr: { bgColor: 'yellow' } ,
			firstRowTextAttr: { color: 'yellow' , inverse: true} ,
			// firstColumnTextAttr: { color: 'yellow' } ,
			// checkerEvenCellTextAttr: { bgColor: 'gray' } ,
			width: term.width ,
			height: term.height,
			fit: false 
		}
	) ;
}

function update(){
	var c = callback();
	violators = c['violators']
	csproData = c['csproData']
	cspro = c['cspro']
	term.clear();
	if (state === STATES.menu){
		draw_menu();
	} else if (state === STATES.hosts) {
		draw_violator();
	} else {
		draw_violator_paths();
	}
	setTimeout(() => {
		update();
	}, 100);
}

function key_up(){
	cursor[state].y -= 1;

	if (cursor[STATES.menu].y < 0){
		cursor[STATES.menu].y = 0;
	}
}

function key_down(){
	cursor[state].y += 1;

	if (cursor[STATES.menu].y >= violators.size){
		cursor[STATES.menu].y = violators.size - 1;
	}
}

function key_left(){
	if (state === STATES.hosts) {
		state = STATES.menu
	} else {
		state = STATES.hosts
	}
}

function key_right(){
	if (state === STATES.menu) {
		state = STATES.hosts
		cursor[state] = {y: 0}
		selectedDirective = utils.csp_directives[cursor[STATES.menu].y]
	} else if (state === STATES.hosts){
		state = STATES.paths
		selectedHost = Object.keys(violators[selectedDirective])[cursor[STATES.hosts].y]
	} 
}


function start(_callback){
	term = terminal_kit.terminal
	callback = _callback;
	term.grabInput(true);
	term.on('key', (name, matches, data) => {
		if (name === 'j' || name === 'DOWN')
			key_down();
		else if (name === 'k' || name === 'UP')
			key_up();
		else if (name === 'h' || name === 'LEFT')
			key_left();
		else if (name === 'l' || name === 'RIGHT')
			key_right();
		else if (name === 'CTRL_C')
			process.exit()
	});
	update();
}

function end(){
	term.grabInput(false);
}

module.exports = {
	'start': start
}

