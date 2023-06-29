const terminal_kit = require('terminal-kit')
const url = require('url')

const utils = require('./ServerUtils.js')

var term = null;
var violators = null;

var callback = null;

var curr_state = 'menu';

var cursor_data = {
	menu: {y: 0}
};

function draw_menu(){
	var table = [[ 'csp directive' , 'websites' ]]
	for (var k in violators){
		table.push([k, Object.keys(violators[k]).map(u => url.parse(u).hostname).join(' ')])
	}
	table[cursor_data.menu.y+1][0] = '^!' + table[cursor_data.menu.y+1][0]
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
}

function draw_violator(){
	var violator = curr_state;
	var table = [[ violator ]];
	table.push(Object.keys(violators[violator]).map(u => url.parse(u).hostname))
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
	violators = callback();
	term.clear();
	if (curr_state === 'menu'){
		draw_menu();
	} else {
		draw_violator();
	}
	setTimeout(() => {
		update();
	}, 100);
}

function key_up(){
	cursor_data[curr_state].y -= 1;

	if (cursor_data.menu.y < 0){
		cursor_data.menu.y = 0;
	}
}

function key_down(){
	cursor_data[curr_state].y += 1;

	if (cursor_data.menu.y >= violators.size){
		cursor_data.menu.y = violators.size - 1;
	}
}

function key_left(){
	if (curr_state !== 'menu') {
		curr_state = 'menu';
	}
}

function key_right(){
	if (curr_state === 'menu') {
		curr_state = utils.csp_directives[cursor_data.menu.y]
	}
}


function start(_callback){
	term = terminal_kit.terminal
	callback = _callback;
	violators = callback();
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

