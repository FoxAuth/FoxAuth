#!/usr/bin/bash

# Firefox extension build script
# Syntax:
#   build.sh

# Only firefox is supported
PLATFORM=firefox

# Delete old files
echo "Removing old build files..."
rm -rf build
rm -rf $PLATFORM

# Check code style
echo "Checking code style..."
gts check

# Compile typescript
echo "Compiling..."
npm run compile
mkdir $PLATFORM

# Build
cp -r scripts \
      src/css \
      src/icons \
      src/_locales \
      src/options \
      src/popup.html \
      src/libs \
      LICENSE \
      $PLATFORM

cp src/manifest.json $PLATFORM/manifest.json
