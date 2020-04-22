#!/bin/bash

# https://gist.github.com/JamieMason/4761049

# return 1 if global command line program installed, else 0
# example
# echo "node: $(program_is_installed node)"
function program_is_installed {
  # set to 1 initially
  local return_=1
  # set to 0 if not found
  type $1 >/dev/null 2>&1 || { local return_=0; }
  # return value
  echo "$return_"
}

function print_version {
  local version="--version"
  if [ ! -z "$2" ]; then
    version=$2
  fi

  if [ $(program_is_installed $1)  == 1 ]; then
    printf "$1 $version"
  fi
}

# display a message in red with a cross by it
# example
# echo echo_fail "No"
function echo_fail {
  # echo first argument in red
  printf "\e[31m✘ ${1}"
  # reset colours back to normal
  echo "\033[0m"
}

# display a message in green with a tick by it
# example
# echo echo_fail "Yes"
function echo_pass {
  # echo first argument in green
  printf "\e[32m✔ ${1}"
  # reset colours back to normal
  echo "\033[0m"
}

# echo pass or fail
# example
# echo echo_if 1 "Passed"
# echo echo_if 0 "Failed"
function echo_if {
  if [ $1 == 1 ]; then
    echo_pass "$2"
  else
    echo_fail "$2"
  fi
}

# ============================================== Functions

normal=$(tput sgr0)
bright=$(tput bold)

# command line programs
printf "${bright} --- Node.js 10 or later ---${normal}\n"

echo "node    $(echo_if $(program_is_installed node))"
$(print_version node)
printf "\n"

printf "${bright} --- npm or Yarn ---${normal}\n"

echo "npm    $(echo_if $(program_is_installed npm))"
$(print_version npm)
printf "\n"

echo "yarn    $(echo_if $(program_is_installed yarn))"
$(print_version yarn)
printf "\n"

printf "${bright} --- Xcode 10 or later for iOS apps ---${normal}\n"

echo "Xcode  $(echo_if $(program_is_installed xcodebuild))"
$(print_version xcodebuild -version)
printf "\n"

printf "${bright} --- Android Studio for Android apps ---${normal}\n"

echo "Android  $(echo_if $(program_is_installed $ANDROID_HOME/tools/bin/sdkmanager))"
if [ $(program_is_installed $ANDROID_HOME/tools/bin/sdkmanager) == 0 ]; then
  echo $(echo_if 0 "Please make sure to install android sdk and set ANDROID_HOME in env variables." )
fi
printf "\n"

printf "${BRIGHT} --- Electrode Native ---${normal}\n"

echo "ern $(echo_if $(program_is_installed ern))"
$(print_version ern)
printf "\n"
