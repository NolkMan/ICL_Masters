const pg = require('pg')
require('dotenv').config()

var fs = require('fs');
var util = require('util');

var log_file = fs.createWriteStream('postgre_error.log', {flags : 'w'});

function errLog(d) { //
  log_file.write(util.format(d) + '\n');
};

const client = new pg.Client();

function start(callback){
	client.connect((err) => {
		if (err) {
			errLog(err.stack)
			client.end()
			callback()
		} else {
			var q =  
			client.query('CREATE TABLE IF NOT EXISTS cspro_reports (\
				id SERIAL PRIMARY KEY,\
				host VARCHAR(255) NOT NULL,\
				time timestamptz NOT NULL,\
				report JSON NOT NULL\
			);', (err, res) => {
				if (err) {
					errLog('Create Table')
					errLog(err)
				}
				console.log('PSQL started')
				callback()
			})
		}
	})
}

function end(){
	client.end()
}

function logReport(host, report){
	client.query('INSERT INTO cspro_reports(host, time, report)\
		VALUES ($1, CURRENT_TIMESTAMP, $2);', [host, report], (err) => {
			if (err)
				errLog(err)
	});
}

module.exports = {
	start: start,
	end: end,
	logReport: logReport,
}
