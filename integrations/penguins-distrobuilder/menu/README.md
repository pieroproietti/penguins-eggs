
# distrobuilder-menu

* [![Pylint](https://github.com/itoffshore/distrobuilder-menu/actions/workflows/pylint.yaml/badge.svg)](https://github.com/itoffshore/distrobuilder-menu/actions/workflows/pylint.yaml)

* A [python](https://www.python.org/) console frontend to [Distrobuilder](https://linuxcontainers.org/distrobuilder/docs/latest/) for building **standard** or **customised LXD / LXC** images

---

* ##### **Main Menus (LXD | LXC)**
<p align="center" width="100%">
  <img width="85%" src="https://github.com/itoffshore/distrobuilder-menu/assets/1141947/0cf16667-c577-4a87-8681-10ce77bfe1ee">
</p>

* Install from [pypi.org](https://pypi.org/project/distrobuilder-menu/)
  - `pipx install distrobuilder-menu`
  
* Install [Arch Linux package from AUR](https://aur.archlinux.org/packages/distrobuilder-menu)
  - `yay distrobuilder-menu`
    
* Build LXD or LXC containers:
  - `dbmenu || dbmenu --lxc`

---

### ➡️ Features
* App [version upgrades](https://github.com/itoffshore/distrobuilder-menu#%EF%B8%8F-upgrading-with-dbmenu--v) via [pypi](https://pypi.org/project/distrobuilder-menu) & [Distrobuilder template](https://github.com/lxc/lxc-ci/tree/main/images) updates via the [Github REST API](https://docs.github.com/en/rest):
   - `dbmenu -v`
   - `dbmenu -u`
* Create:
   - [cloud-init](https://cloudinit.readthedocs.io) `per-once` / standard configuration
   - **template overrides** to include custom files / scripts
   - **custom templates** by **merging** the template override / cloud-init `yaml`
* Automatic **custom template [re-generation](https://github.com/itoffshore/distrobuilder-menu#%EF%B8%8F-regenerating-custom-templates--in-v020)** as part of updating the `standard` templates:
   - This ensures `custom` templates remain in sync with `standard` templates (which change distribution versions over time)
* Automatic selective **caching** of `json` output from **LXD** `images:`

   - `json` read speed improved from `1mb` / `0.65` seconds **===>** `30kb` / `0.0083` seconds
   - Fast `yaml` reading with `yaml.CSafeLoader`
   - Fast menu generation (typically `0.03` seconds or less)
   - Auto generated menus for the available container versions your [`platform`](https://docs.python.org/3/library/platform.html) can build:

* ##### **Version Menu**
<p align="center" width="100%">
  <img width="70%" src="https://github.com/itoffshore/distrobuilder-menu/assets/1141947/58c14b68-03e3-4ce5-bbf7-110278a64bf2">
</p>

* Optionally `import` the built **LXD** image into [`incus`](https://github.com/lxc/incus) or [`lxd`](https://ubuntu.com/lxd)
* To disable automatic **LXD** imports **_Show User Configuration_** from the **Main Menu** & edit / set `import_into_lxd` to `False`

---
### ➡️ Command line options:
```
usage: dbmenu [-h] [--lxd | --lxc | -o | -g | -i | -c | -e | -d | -m | -y | -u]
                          [-s] [-t] [--rate] [--reset] [-r] [-v]

Menu driven LXD / LXC images for Distrobuilder

options:
  -h, --help        show this help message and exit
  --lxd             build LXD container / vm image (default)
  --lxc             build LXC container image
  -o, --override    create new template override
  -g, --generate    generate custom template from override
  -i, --init        create / edit cloud-init configuration
  -c, --copy        copy existing template / override
  -e, --edit        edit existing template / override
  -d, --delete      delete template / override
  -m, --move        move / rename template or override
  -y, --merge       merge cloudinit configuration with yq
  -u, --update      force update templates (default auto weekly)
  -s, --show        show configuration settings
  -t, --timer       debug timer used in testing
  --rate            show current Github API Rate Limit
  --reset           reset dbmenu base directory configuration
  -r, --regenerate  regenerate custom templates
  -v, --version     show dbmenu version / update to latest release
```
### ➡️ User Configuration:
* User configuration is stored under `~/.config/dbmenu.yaml` & is auto generated with sensible defaults on the first run of `dbmenu`
* The base directory of the **distrobuilder** area can be optionally changed from the **default** `~/distrobuilder` on first run or at any time via the `dbmenu --reset` command line option
```
[~]$ cat ~/.config/dbmenu.yaml
config_dir: /home/stuart/.config
main_dir: /home/stuart/devops/distrobuilder
target_dir: /home/stuart/devops/distrobuilder/build
files_dir: /home/stuart/devops/distrobuilder/files
template_dir: /home/stuart/devops/distrobuilder/templates
cloudinit_dir: /home/stuart/devops/distrobuilder/cloudinit
dbmenu_config: /home/stuart/.config/dbmenu.yaml
gh_owner: lxc
gh_repo: lxc-ci
gh_api_url: https://api.github.com
github_token: ''
cache_dir: false
cleanup: true
compression: xz
console_editor: nano
debug: false
disable_overlay: false
import_into_lxd: true
json_cachefile: /home/stuart/devops/distrobuilder/templates/cache.json
lxd_json: /home/stuart/devops/distrobuilder/templates/lxd.json
lxd_output_type: unified
subdir_custom: /home/stuart/devops/distrobuilder/templates/custom
subdir_images: /home/stuart/devops/distrobuilder/templates/images
subdir_overrides: /home/stuart/devops/distrobuilder/templates/overrides
cloudinit_network_dir: /home/stuart/devops/distrobuilder/cloudinit/network-data
cloudinit_user_dir: /home/stuart/devops/distrobuilder/cloudinit/user-data
cloudinit_vendor_dir: /home/stuart/devops/distrobuilder/cloudinit/vendor-data
timeout: false
yq_check: true
```
* For normal operation it's **not** necessary to add a **Github Personal Access Token** to your User Configuration
* Unauthenticated [Github API Rate Limits](https://docs.github.com/en/rest/rate-limit?apiVersion=2022-11-28) are not normally exceeded due to `connection-pooling` in `urllib3` & the **API calls** being made by a `singleton` instance of [`Gethub`](https://github.com/itoffshore/distrobuilder-menu/blob/main/src/distrobuilder_menu/api/gethub.py)
* To check your current **Github API rate limit** run `dbmenu --rate`
---

### ➡️ Dependencies
* [python](https://www.python.org/) `3.10+` / `pyyaml` / `urllib3`
* [Golang version `4+` of `yq`](https://github.com/mikefarah/yq) (`go-yq` in **Arch Linux**)
* [`incus`](https://github.com/lxc/incus) (`incus` is [required now](https://discuss.linuxcontainers.org/t/important-notice-for-lxd-users-image-server/18479) for building some templates) or [`lxd`](https://ubuntu.com/lxd)
* [Distrobuilder](https://github.com/lxc/distrobuilder) version `3.0` or higher

---

### ➡️ Installation / Upgrading
* ✅ Arch Linux [package from AUR](https://aur.archlinux.org/packages/distrobuilder-menu):

   - `yay distrobuilder-menu`
  
* ✅ Isolated app (choose either pypi or github):

   - `pipx install distrobuilder-menu` (pypi)
   - `pipx install git+https://github.com/itoffshore/distrobuilder-menu.git` (github)
   - size on disk `4mb`
   - upgrade release with `--force`

* ‼️ System module (choose either pypi or github):

   - `pip install distrobuilder-menu` (pypi)
   - `pip install git+https://github.com/itoffshore/distrobuilder-menu.git` (github)
   - size on disk `600kb`
   - upgrade release with `--force`

* ##### ⬇️ **Upgrading with `dbmenu -v`**
   - 🆕 in version `0.2.5`: `pip` / `pipx` upgrades
   - 🆕 in version `0.2.8`: Arch Linux package detection skips pypi upgrades & displays the latest [AUR version](https://aur.archlinux.org/packages/distrobuilder-menu)
<p align="center" width="100%">
  <img width="90%" src="https://github.com/itoffshore/distrobuilder-menu/assets/1141947/97542904-cd3e-47d3-b99b-5bf13912980d">
</p>   

* 🆕 in version `0.2.6` - a compatibility symlink for `lxd` is automatically created to ensure [Distrobuilder](https://linuxcontainers.org/distrobuilder/docs/latest/) can find `/var/lib/incus/unix.socket` to import built images.
* ⚠️ By default `import_into_lxd` is `True` in user settings & can be edited with: `dbmenu -s` or option `11` from the **Main Menu** (if neither `lxd` or `incus` are installed locally)

   - For versions prior to `0.2.6` create the symlink manually if you use `lxd` & want to import built images:
   - `ln -s /var/lib/lxd /var/lib/incus`

---

### ❓ Creating Override Templates

`dbmenu` was inspired by & follows a similar methodology to [Hashicorp Packer](https://www.packer.io/) which builds / creates templates in layers:

* Create a **_base_** image override for your chosen distribution with your `shell` / package customizations that overrides a **standard template**

* ##### **Distribution Menu**
<p align="center" width="100%">
  <img width="90%" src="https://github.com/itoffshore/distrobuilder-menu/assets/1141947/7731977e-1f67-4372-b40c-642988befbae">
</p>

* This will generate an **_override_** template with an example `files` & `packages` sections to customise & optionally open in your configured `console_editor` (`nano` by default)
* ⚠️ An **_override_** only needs the **extra** packages you wish to include (& not all of the packages that are included as an **example** of the `yaml` from the `SOURCE` template you are overriding)

* ##### **Override Template**
<p align="center" width="100%">
  <img width="90%" src="https://github.com/itoffshore/distrobuilder-menu/assets/1141947/977a6686-a4b0-465e-a102-7f3dc43f6450">
</p>

* Create a **_specific_** override / `cloud-init` config for your custom **service container** that contains customizations **not** in your **_base_** image template (e.g **web services** / **database**)
* Generate a **Custom Template** which uses your custom **_base_** image template as the `SOURCE` template & **merges** your **_specific_** overrides / cloud-init for your custom **service container**

---

### 📰 Template Examples
* This repo's [`examples`](https://github.com/itoffshore/distrobuilder-menu/tree/main/examples) directory is also packaged under `site-packages`:

   - e.g for `pipx` installs:

   - `~/.local/pipx/venvs/distrobuilder-menu/lib/python3.11/site-packages/distrobuilder_menu/examples`

   - e.g for installs from an Arch Linux package:

   - `/usr/lib/python3.11/site-packages/distrobuilder_menu/examples`


* These `examples` show how to create images for:

   - Alpine Linux / Ubuntu **_base_** images
   - [Alpine Linux](https://alpinelinux.org/) build environment (`21mb`) that installs `alpine-sdk` on first boot via cloud-init & [most of the steps](https://wiki.alpinelinux.org/wiki/Creating_an_Alpine_package#Setup_your_system_and_account) for contributing packages to Alpine
   - See the **alpine-abuild** [cloud-init `bootcmd`](https://github.com/itoffshore/distrobuilder-menu/blob/66dc4ea1830daba9ea3b1ba566254652cfbc08c8/examples/cloudinit/user-data/alpine-abuild.yaml#L3) for how to build an Alpine Linux cloud image & remove cloud-init & it's dependencies on first boot
   - Ubuntu [Gitlab](https://about.gitlab.com/) container that installs **Gitlab** on first `boot` via `cloud-init`

---

### 🏗️ Creating / Building a Custom Template

* Empty input for each menu option / choice will `return` you to the **Main Menu** (`main event loop`)

* **_Create Custom Override_**
* Optionally - **_Create cloud-init Config_**
* **_Generate Custom Template_**

   - this option gives choices to **merge** a **Custom Override** & **cloud-init** configuration
   - you could also just **_Merge cloud-init Config_** into an existing template if you only need that option

* **_Build image_** - choosing the template type:

   - **LXD images** are built by `default`
   - to build `lxc` images start the app with `dbmenu --lxc`
   - **_default container_** (LXC & LXD)
   - **_cloud container_** (LXC & LXD)
   - **_vm_** (LXD only)

---

### 🏗️ Regenerating Custom Templates (🆕 in `v0.2.0`)

* Over time the distribution versions in `standard` **Distrobuilder templates** change (causing `custom` templates to become outdated)
* `v0.2.0` adds a `json` [footer](https://github.com/itoffshore/distrobuilder-menu/blob/ff0f7ddcf1e1403520b52bfa70bd4baa30355ef3/examples/templates/custom/alpine-abuild.yaml#L500) as a comment with details of how the `custom` template was generated. To use this new feature existing `custom` / `base` templates created before `v0.2.0` will need to be re-created (so the `json` footer is written to the template)
* 🆕 in `v0.2.1` - automatic `custom` template regeneration is incorporated into `standard` template updates / downloads
* Custom templates can also be regenerated at any time with: `dbmenu -r`

* ##### **Automatic template regeneration**
<p align="center" width="100%">
  <img width="85%" src="https://github.com/itoffshore/distrobuilder-menu/assets/1141947/73452833-b24b-4ca3-935d-5ec2e2c14eac">
</p>

* `base` templates that use `standard` templates as a `SOURCE` are regenerated first
* `custom` templates which override a `base` template are regenerated afterwards
* for templates without a `dbmenu` generated `json` footer a warning message is shown
