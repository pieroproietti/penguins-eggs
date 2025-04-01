#!/usr/bin/env bash
## WARNING WHEN CHANGING CI FILES

### 1. Do not modify CI files unless you are absolutely sure.
### 2. Do not make unnecessary changes to CI files.
### 3. Do not disable any CI tests; all tests must remain active.
### 4. Do not alter the current ISO build workflow.
### 5. Do not modify existing CI file numbers. If adding new tests, use a new number range (e.g., 30000-40000, 50000).
### 6. If using penguins-wardrobe for builds, add new CI tests instead of modifying existing workflows.

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
cd $CMD_PATH

###############################################################################################################
# Check if the overlay filesystem is enabled on the CI server
grep overlay /proc/filesystems
sudo modprobe overlay
pwd
env
whoami

###############################################################################################################
# Do not delete .deb or tarball files, as both are required for testing.
# Debian packages (.deb) are used for VM-based testing, while tarballs are used in container-based testing.
# Multiple architectures are supported (e.g., podman --platform linux/386 linux/amd64).
# Ensure these files are preserved for future tests.
npm install -g pnpm@latest-10
pnpm install
pnpm deb -a -r $GITHUB_RUN_NUMBER
pnpm tarballs --release $GITHUB_RUN_NUMBER
rsync -a ./perrisbrewery/workdir/*.deb ./mychroot/ci/
rsync -a ./dist/*.tar.gz ./mychroot/ci/
ls -al ./mychroot/ci/

###############################################################################################################
## TODO 0
## Verify the CI server environment
## The CI server is running Ubuntu 24.04 on an Azure virtual machine.
## Ubuntu 24.04.2 LTS \n \l

sudo cat /etc/issue
ls -al /etc/

# Fix podman pull error: 
# "Get 'https://registry-1.docker.io/v2/': dial tcp: lookup registry-1.docker.io on 127.0.0.53:53: read udp 127.0.0.1:53545->127.0.0.53:53: read: connection refused"
sudo cat /etc/resolv.conf
sudo apt purge resolvconf -y
sudo rm /etc/resolv.conf
sudo touch /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
echo "nameserver 8.8.4.4" | sudo tee -a /etc/resolv.conf
echo "nameserver 127.0.0.53" | sudo tee -a /etc/resolv.conf
echo "options edns0 trust-ad" | sudo tee -a /etc/resolv.conf
sudo cat /etc/resolv.conf
