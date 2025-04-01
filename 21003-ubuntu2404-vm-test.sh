#!/usr/bin/env bash
## **Warnings When Modifying CI Files**  

### 1. **Do not modify CI files unless absolutely necessary.**  
### 2. **Do not disable any CI tests**—all tests must remain active.  
### 3. **Do not change the current ISO build workflow.**  
### 4. **CI test scripts follow a fixed numbering system.** To add new tests, use a new range (e.g., `30000-40000`, `50000`), and do not modify existing numbered files.  
### 5. **If using `penguins-wardrobe` for builds, add new CI tests instead of modifying existing files or workflows.**  
### 6. **All CI file modifications must be submitted in a new Pull Request and reviewed by @gnuhub—do not merge directly.**  
### 7. **For experimental changes, create a new branch instead of modifying `master`.**  

set -x
source ./10000-ubuntu-ci-server.sh

cd $CMD_PATH
sudo apt install -y ./mychroot/ci/penguins-eggs_*_amd64.deb
mksquashfs -version
sudo eggs dad -d
sudo eggs produce --clone -n --verbose

df -h
date