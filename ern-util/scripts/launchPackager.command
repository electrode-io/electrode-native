#!/usr/bin/env bash

# Set terminal title
echo -en "Starting React Packager\n"

THIS_DIR=$(dirname "$0")
cd $THIS_DIR

source packageRunner.config
rm -f packageRunner.config
cd $cwd

npm start

echo "Process terminated. Press <enter> to close the window"
read