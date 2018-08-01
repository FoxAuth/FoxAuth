#!/usr/bin/bash

# Extension build script
# Syntax:
#   build.sh

PLATFORM=firefox

echo "Removing old build files..."
rm -rf build
rm -rf $PLATFORM

echo "Checking code style..."
gts check

echo "Compiling..."
npm run compile
mkdir $PLATFORM

cp -r build src/css src/icons src/images src/js src/_locales LICENSE src/options src/views $PLATFORM
cp manifest-$PLATFORM.json $PLATFORM/manifest.json
