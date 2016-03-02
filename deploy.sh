#!/bin/sh
git pull origin master
sudo npm update
sudo stop chat
sudo start chat
