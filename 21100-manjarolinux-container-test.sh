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
which podman 
podman --version
df -h

podman run \
        --hostname minimal \
        --privileged \
        --cap-add=CAP_SYS_ADMIN \
        --ulimit nofile=32000:32000 \
        --pull=always \
        -v $PWD/mychroot/ci:/ci \
        -v /dev:/dev \
        manjarolinux/base:latest \
        /ci/30008.run-on-manjarolinux.sh

df -h
ls -al $PWD/mychroot/ci/iso/
# upload $PWD/mychroot/ci/iso/ to server or github
date
