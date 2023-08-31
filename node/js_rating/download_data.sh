#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
echo $SCRIPT_DIR

JSNO="${SCRIPT_DIR}/JSNotObfuscated.7z"
JSO="${SCRIPT_DIR}/JSObfuscated.7z"

if [ ! -f "${JSNO}" ]; then
	curl "https://raw.githubusercontent.com/PacktPublishing/Machine-Learning-for-Cybersecurity-Cookbook/master/Chapter03/Detecting%20Obfuscated%20Javascript/JavascriptSamplesNotObfuscated.7z" \
		-o ${JSNO}
	7zz x ${JSNO}
fi

if [ ! -f "${SCRIPT_DIR}/${JSO}" ]; then
	output=${SCRIPT_DIR}/$
	curl "https://raw.githubusercontent.com/PacktPublishing/Machine-Learning-for-Cybersecurity-Cookbook/master/Chapter03/Detecting%20Obfuscated%20Javascript/JavascriptSamplesObfuscated.7z" \
		-o ${JSO}
	7zz x ${JSO}
fi

