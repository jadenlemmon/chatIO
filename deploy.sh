#!/bin/sh
git pull origin master
sudo npm update
forever stop server.js
forever start -o out.log -e err.log server.js
