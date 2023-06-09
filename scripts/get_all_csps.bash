#!/bin/bash
WEBSITES=$(<websites.txt)
HEADER_FILE="headers.txt"

function get_host(){
	host=${1#*://}
	host=${host%%/*}
	echo $host
}


function setup_and_curl(){
	host=$(get_host $1)
	curl -s -v --header "@$HEADER_FILE" $1 1> /dev/null 2> ./gac_headers/$host.out
}

for website in $WEBSITES; do
	setup_and_curl $website
done

