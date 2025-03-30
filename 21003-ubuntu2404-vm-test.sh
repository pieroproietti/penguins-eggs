#!/usr/bin/env bash
## WARNING WHEN CHANGING CI FILES

### 1. don't change ci files if you are not sure
### 2. don't change ci files if it is not necessary
### 3. don't disable any one of ci tests
### 4. don't change the current workflow of build iso
### 5. don't change the number of ci files, just add new files with a new number range such as 30000- 40000 50000
### 6. if you want to use penguins-wardroe to build,add new ci tests and don't change the current ci files and workflows
### 7. if you want to change this file, add a new pull request and @gnuhub don't merge it
### 8. if you just test changes ,don't change it on master,checkout -b a new branch

set -x
source ./10000-ubuntu-ci-server.sh

cd $CMD_PATH
sudo apt install -y ./mychroot/ci/penguins-eggs_*_amd64.deb
mksquashfs -version
sudo eggs dad -d
sudo eggs produce --clone -n --verbose

df -h
date