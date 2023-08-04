#!/bin/bash

key=$(cat .key)

mkdir -p ../netcraft-data

curl 'https://blockdb.netcraft.com/blockdb/cspfyp-vAmmG0KK/full' \
	-H "Authorization: Bearer $key" \
	-o '../netcraft-data/malicious_js.json'
