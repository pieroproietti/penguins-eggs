# pods

Here we have scripts to build on local system, using podman container.
* `almalinux.sh`
* `archlinux.sh`
* `debian.sh`
* `devuan.sh`
* `fedora.sh`
* `openmamba.sh`
* `opensuse.sh`
* `ubuntu.sh`

Example: to create a minimal debian ISO, run `pods/debian.sh`, then within the container run `/ci/run`. Live ISO will be created on `/home/eggs/.mnt`.

You can easily export the iso using: `eggs export iso -c`, no need to copy on ci and this command remove the previous ISOs with same name created.

# Plan
I want to refine this method in the hope that it will be useful by using it as a github action.

Here we build penguins-eggs as tarballs to install it on every distro. It's possible tu run `pnpm tarballs --release xx` and the scripts will be import it on the container.

# Resulting ISOs
Resulting live ISOs can be found [here](https://drive.google.com/drive/folders/15jAwpk-k27dSuqD4iUZkjADgh9-tRI-4?dmr=1&ec=wgc-drive-globalnav-goto)

