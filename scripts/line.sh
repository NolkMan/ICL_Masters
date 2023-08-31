#!/bin/bash

sed "${1}q;d" '../netcraft-data/malicious_js.json' | \
	python3 -m json.tool
