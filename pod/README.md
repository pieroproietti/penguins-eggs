# pod

Here we have scripts to build on local system, using podman container.

* `debian.sh`
° `archlinux.sh`
* `ubuntu.sh`

To create a debian ISO, run `pod/debian.sh`, then within the container run `/ci/run`. Live ISO will be created on `/home/eggs/.mnt`.

# Prerequisites
You must to be on a Debian or Ubuntu system, and have `podman` installed.

# Plan
I want to refine this method in the hope that it will be useful by using it as a github action.

# Resulting ISOs
Materials and relative installable live ISOs can be found [here](https://drive.google.com/drive/folders/15jAwpk-k27dSuqD4iUZkjADgh9-tRI-4?dmr=1&ec=wgc-drive-globalnav-goto)
