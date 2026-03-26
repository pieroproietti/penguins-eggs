#!/usr/bin/env sh

# This script builds and installs the app to archiso airootfs

cargo build --release

cp target/release/easy-language-config ../airootfs/usr/local/bin