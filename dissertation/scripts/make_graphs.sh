#!/bin/bash

cd ${0%/*}
files=$(ls)

for f in $files; do
	if [ "${f##*.}" = "py" ]; then
		python3 $f
	fi
done

