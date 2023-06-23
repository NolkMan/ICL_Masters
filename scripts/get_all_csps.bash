#!/bin/bash
WEBSITES=$(<../netcraft-data/just-top-1M-sites.tsv)
HEADER_FILE="headers.txt"

i=1

function get_host(){
	host=${1#*://}
	# host=${host%%/*}
	echo $host
}


function setup_and_curl(){
	host=$(get_host $1)
	curl -s -v --header "@$HEADER_FILE" $1 1> /dev/null 2> ./gac_headers/$host.out &
	pids[${i}]=$!
}

mkdir -p gac_headers
for website in $WEBSITES; do
	setup_and_curl $website
	i=$((i+1))
	if ! ((i % 10000)); then
		echo $i
	fi
done

for pid in ${pids[*]}; do
    wait $pid
done

echo "Done"
