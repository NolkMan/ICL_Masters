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
	paths: 3,
	reports: 4,
	details: 5
}
var state = STATES.menu
var selectedDirective = utils.csp_directives[0]
var selectedHost = ''
var selectedUrl = ''
var selectedReport = ''

var cursor = {
	'1': {y: 0}
};

function fit_table(table){
	var height = term.height
	if (table.length > height){
		var beg = cursor[state].y - 3
		var end = cursor[state].y - 3 + height
		if (beg < 0){
			end -= beg
			beg -= beg
		}
		if (end > table.length){
			beg = table.length - height
			end = table.length
		}
		var newtab = table.slice(beg+1,end-1)
		newtab.unshift(table[0])
		return newtab
	}
	return table
}

function draw_menu(){
	var table = [[ 'csp directive' , 'websites' ]]
	for (const dir of utils.csp_directives){
		table.push([dir, Array.from(violators.get(dir).keys()).join(' ')])
	}
	if (cursor[STATES.menu].y >= violators.size){
		cursor[STATES.menu].y = violators.size - 1;
	}
	table[cursor[STATES.menu].y+1][0] = '^!' + table[cursor[STATES.menu].y+1][0]
	term.table( table , {
			hasBorder: false ,
			contentHasMarkup: true ,
			textAttr: { bgColor: 'default' } ,
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
	var hosts = violators.get(selectedDirective)
	for (const host of hosts.keys()){
		if (csproData[selectedDirective] &&
			csproData[selectedDirective].includes(host)){
			table.push(['  ', '^G' + host])
		} else {
			table.push(['  ', '^R' + host])
		}
	}
	if (cursor[STATES.hosts] >= hosts.length){
		cursor[STATES.hosts] = hosts.length-1
	}
	table[cursor[STATES.hosts].y+1][0] = '^!' + table[cursor[STATES.hosts].y+1][0]
	term.table( fit_table(table) , {
			hasBorder: false ,
			contentHasMarkup: true ,
			textAttr: { bgColor: 'default' } ,
			firstRowTextAttr: { color: 'yellow' , inverse: true} ,
			width: term.width ,
			height: term.height,
			fit: false 
		}
	) ;
}

function draw_violator_paths(){
	var table = [[ '  ', selectedDirective + ': ' + selectedHost ]];
	for (const u of violators.get(selectedDirective).get(selectedHost).keys()){
		table.push(['  ', u])
	}
	table[cursor[STATES.paths].y+1][0] = '^!' + table[cursor[STATES.paths].y+1][0]
	term.table( fit_table(table) , {
			hasBorder: false ,
			contentHasMarkup: true ,
			textAttr: { bgColor: 'default' } ,
			firstRowTextAttr: { color: 'yellow' , inverse: true} ,
			width: term.width ,
			height: term.height,
			fit: false 
		}
	) ;
}

function escape_string(str){
  return str
    .replace(/[\\]/g, '\\\\')
    .replace(/[\"]/g, '\\\"')
    .replace(/[\/]/g, '\\/')
    .replace(/[\b]/g, '\\b')
    .replace(/[\f]/g, '\\f')
    .replace(/[\n]/g, '\\n')
    .replace(/[\r]/g, '\\r')
    .replace(/[\t]/g, '\\t');
}

function draw_reports(){
	var table = [[ '  ', 'Source file', 'line', '  sample']];
	for (const r of violators.get(selectedDirective).get(selectedHost).get(selectedUrl)){
		table.push(['  ', r['source-file'], '  ' + r['line-number'], ' ' + escape_string(r['script-sample'])])
	}
	table[cursor[STATES.reports].y+1][0] = '^!' + table[cursor[STATES.reports].y+1][0]
	term.table( fit_table(table) , {
			hasBorder: false ,
			// borderChars: 'empty',
			contentHasMarkup: true ,
			textAttr: { bgColor: 'default' } ,
			firstRowTextAttr: { color: 'yellow' , inverse: true} ,
			width: term.width ,
			height: term.height,
			fit: false 
		}
	) ;
}

function draw_details(){
	var table = [[ '  ', selectedDirective + ': ' + selectedUrl ]];
	term.table( table , {
			hasBorder: false ,
			contentHasMarkup: true ,
			textAttr: { bgColor: 'default' } ,
			firstRowTextAttr: { color: 'yellow' , inverse: true} ,
			width: term.width ,
			height: term.height,
			fit: false 
		}
	) ;
	console.log(selectedReport)
}

function update(){
	var c = callback();
	violators = c['violators']
	csproData = c['csproData']
	cspro = c['cspro']
	term.clear();
	try {
		if (state === STATES.menu){
			draw_menu();
		} else if (state === STATES.hosts) {
			draw_violator();
		} else if (state === STATES.paths) {
			draw_violator_paths();
		} else if (state === STATES.reports) {
			draw_reports();
		} else if (state === STATES.details) {
			draw_details();
		}
	} catch (err) {
		state = STATES.menu
	}
	setTimeout(() => {
		update();
	}, 100);
}

function key_up(){
	cursor[state].y -= 1;
	if (cursor[state].y < 0)
		cursor[state].y = 0;
}

function key_down(){
	cursor[state].y += 1;
}

function key_left(){
	state --;
	if (state <= 0){
		state = 1
	}
}

function key_right(){
	if (state === STATES.menu) {
		state = STATES.hosts
		selectedDirective = utils.csp_directives[cursor[STATES.menu].y]
	} else if (state === STATES.hosts){
		state = STATES.paths
		selectedHost = Array.from(violators.get(selectedDirective).keys())[cursor[STATES.hosts].y]
	} else if (state === STATES.paths){
		state = STATES.reports
		selectedUrl  = Array.from(violators.get(selectedDirective).get(selectedHost).keys())[cursor[STATES.paths].y]
	} else if (state === STATES.reports){
		state = STATES.details
		selectedReport = violators.get(selectedDirective).get(selectedHost).get(selectedUrl)[cursor[STATES.reports].y]
	}
	cursor[state] = {y: 0}
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

