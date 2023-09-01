#!/bin/bash

cd ${0%/*}
cd test_server

node server.js 443
