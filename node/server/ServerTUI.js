const terminal_kit = require('terminal-kit')
const url = require('url')

var term = null;
var violators = null;

var callback = null;

function update(){
	violators = callback();
	var table = [[ 'csp directive' , 'websites' ]]
	for (var k in violators){
		table.push([k, Object.keys(violators[k]).map(u => url.parse(u).hostname).join(' ')])
	}
	term.clear();
	term.table( table , {
			hasBorder: false ,
			contentHasMarkup: false ,
			textAttr: { bgColor: 'default' } ,
			firstCellTextAttr: { bgColor: 'blue' } ,
			firstRowTextAttr: { bgColor: 'yellow' } ,
			firstColumnTextAttr: { bgColor: 'red' } ,
			checkerEvenCellTextAttr: { bgColor: 'gray' } ,
			width: term.width ,
			fit: false 
		}
	) ;
	setTimeout(() => {
		update();
	}, 100);
}

function start(_callback){
	term = terminal_kit.terminal
	callback = _callback;
	violators = callback();
	update();
}


module.exports = {
	'start': start
}

