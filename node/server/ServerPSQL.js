const pg = require('pg')
require('dotenv').config()

var fs = require('fs');
var util = require('util');

var log_file = fs.createWriteStream('postgre_error.log', {flags : 'w'});

function errLog(d) { //
  log_file.write(util.format(d) + '\n');
};

const client = new pg.Client();

const cspro_reports_schema = 
	'CREATE TABLE IF NOT EXISTS cspro_reports (\
		id SERIAL PRIMARY KEY,\
		host VARCHAR(255) NOT NULL,\
		time timestamptz NOT NULL,\
		report JSON NOT NULL\
	);'

const js_evaluation_schema =
	'CREATE TABLE IF NOT EXISTS js_evaluation (\
		id SERIAL PRIMARY KEY,\
		host VARCHAR(255) NOT NULL,\
		jsuri TEXT NOT NULL,\
		time timestamptz NOT NULL,\
		evaluation JSON NOT NULL\
	);'

function start(callback){
	client.connect((err) => {
		if (err) {
			errLog(err.stack)
			client.end()
			callback()
		} else {
			var q =  
			client.query(cspro_reports_schema+js_evaluation_schema, (err, res) => {
				if (err) {
					errLog('Create Tables')
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
			if (err){
				errLog('Log Report')
				errLog(err)
			}
	});
}

function getAllReports(host, callback){
	client.query('SELECT * FROM cspro_reports WHERE host=$1;', [host], (err, res) => {
		if (err) {
			errLog('Get All Reports')
			errLog(err)
		}
		callback(res)
	});
}

function logEvaluation(host, jsuri, evaluation){
	client.query('INSERT INTO js_evaluation(host, jsuri, time, evaluation)\
		VALUES ($1, $2, CURRENT_TIMESTAMP, $3);', [host, jsuri, evaluation], (err) => {
			if (err){
				errLog('Log Evaluation')
				errLog(err)
			}
		}
	);
}

function getEvaluation(host, jsuri, callback){
	client.query('SELECT * FROM js_evaluation WHERE host=$1 AND jsuri=$2;', [host, jsuri], (err, res) => {
		if (err) {
			errLog('Get Evaluation')
			errLog(err)
		}
		callback(res)
	});
}

module.exports = {
	start: start,
	end: end,
	logReport: logReport,
	getAllReports: getAllReports,
	logEvaluation: logEvaluation,
	getEvaluation: getEvaluation,
}
