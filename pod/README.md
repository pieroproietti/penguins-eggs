# pod

Here we have scripts to build on local system, using podman container.

* `archlinux.sh`
* `debian.sh`
* `ubuntu.sh`

To create a debian ISO, run `pod/debian.sh`, then within the container run `/ci/run`. Live ISO will be created on `/home/eggs/.mnt`.

# Prerequisites
You must to be on a Debian or Ubuntu system, and have `podman` installed.

# Plan
I want to refine this method in the hope that it will be useful by using it as a github action.

Here we build penguins-eggs as tarballs, and install it on every distro. It's possible tu run `pnpm tarballs` and the scripts will import it on the container.

I have problems running it on Archlinux host, don't work overlayfs. I think is a problem of my configuration. If you find a solution, I will be grateful.


# Resulting ISOs
Materials and relative installable live ISOs can be found [here](https://drive.google.com/drive/folders/15jAwpk-k27dSuqD4iUZkjADgh9-tRI-4?dmr=1&ec=wgc-drive-globalnav-goto)

# Problems on the resulting live ISOs
I don't know why, but on the ISOs resulting it's impossible to log as root using `su` and to use `sudo`.

I tried using podman with user root, but the same. 

