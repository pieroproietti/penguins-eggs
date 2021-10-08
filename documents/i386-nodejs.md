# Nodejs version on eggs packages
From the version eggs-8.17.x we changed the version of the reference node, returning to the old version nodejs 8.17.0.
This guarantees the possibility of creating debian packages for the i386 architecture as well as for amd64, arm64 and armel.

# Nodejs on i386 
The last official version for this architecture is Node.js v8.17.0. We must use the manual installation.

## Debian
Add the NodeSource package signing key
```
KEYRING=/usr/share/keyrings/nodesource.gpg
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor | sudo tee "$KEYRING" >/dev/null
# wget can also be used:
# wget --quiet -O - https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor | sudo tee "$KEYRING" >/dev/null
gpg --no-default-keyring --keyring "$KEYRING" --list-keys
```

Add the desired NodeSource repository
```
# Replace with the branch of Node.js or io.js you want to install: node_6.x, node_8.x, etc...
VERSION=node_8.x
# Replace with the keyring above, if different
KEYRING=/usr/share/keyrings/nodesource.gpg
# The below command will set this correctly, but if lsb_release isn't available, you can set it manually:
# - For Debian distributions: jessie, sid, etc...
# - For Ubuntu distributions: xenial, bionic, etc...
# - For Debian or Ubuntu derived distributions your best option is to use the codename corresponding to the upstream release your distribution is based off. This is an advanced scenario and unsupported if your distribution is not listed as supported per earlier in this README.
DISTRO="$(lsb_release -s -c)"
echo "deb [signed-by=$KEYRING] https://deb.nodesource.com/$VERSION $DISTRO main" | sudo tee /etc/apt/sources.list.d/nodesource.list
echo "deb-src [signed-by=$KEYRING] https://deb.nodesource.com/$VERSION $DISTRO main" | sudo tee -a /etc/apt/sources.list.d/nodesource.list
```

```
sudo nano /etc/apt/sources.list.d/nodesource.list
```
and change bullseye to sid.

Install pyton-minimal-fake, you can found it in scripts, without it is not possible to install in nodejs.


```apt update```

```apt-cache policy nodejs ```

```sudo apt install nodejs=8.17.0-1nodesource1```

After that is better to look apt upgrade of nodejs

just use:

```
sudo apt-mark hold nodejs
```

if You want to remove the hold

```
sudo apt-mark unhold nodejs
```

In this way when you upgrade the system, the version of nodejs10 from the original reporitory of Debian will not be installed.

# Version of packages 
We must be compatible with node8, so this is the result of:

```
npm outdated
Package         Current  Wanted  Latest  Location
@types/js-yaml   3.12.6  3.12.6   4.0.0  penguins-eggs
eslint           5.16.0  5.16.0  7.18.0  penguins-eggs
globby           10.0.2  10.0.2  11.0.2  penguins-eggs
js-yaml          3.14.1  3.14.1   4.0.0  penguins-eggs
```

```
  "dependencies": {
    "@getvim/execute": "^1.0.0",
    "@oclif/command": "^1.8.0",
    "@oclif/plugin-autocomplete": "^0.1.0",
    "@oclif/plugin-help": "^3.2.1",
    "@oclif/plugin-not-found": "^1.2.4",
    "@oclif/plugin-warn-if-update-available": "^1.7.0",
    "@types/inquirer": "^7.3.1",
    "axios": "^0.21.1",
    "chalk": "^4.1.0",
    "clear": "^0.1.0",
    "diskusage": "^1.1.3",
    "drivelist": "^9.2.4",
    "figlet": "^1.5.0",
    "inquirer": "^7.3.3",
    "js-yaml": "^4.0.0",
    "mustache": "^4.1.0",
    "network": "^0.5.0",
    "pjson": "^1.0.9",
    "shelljs": "^0.8.4",
    "tslib": "^ 2.1.0"
  },
  "devDependencies": {
    "@oclif/dev-cli": "^1.21.3",
    "@oclif/test": "^1.2.8",
    "@types/chai": "^4.2.14",
    "@types/clear": "^0.1.1",
    "@types/drivelist": "^6.4.1",
    "@types/figlet": "^1.2.0",
    "@types/js-yaml": "^4.0.0",
    "@types/mocha": "^8.2.0",
    "@types/mustache": "^4.1.1",
    "@types/node": "^14.14.22",
    "@types/shelljs": "^0.8.8",
    "chai": "^4.2.0",
    "eslint": "^7.18.0",
    "eslint-config-oclif": "^3.1.0",
    "eslint-config-oclif-typescript": "^0.2.0",
    "globby": "^11.0.2 ",
    "mocha": "^8.2.1",
    "nyc": "^15.1.0",
    "prettier": "^2.2.1",
    "ts-node": "^9.1.1",
    "typedoc": "^0.20.19",
    "typescript": "^4.1.3"
  },
```

## Contacts
Feel free to contact [me](https://gitter.im/penguins-eggs-1/community?source=orgpage) or open an issue on [github](https://github.com/pieroproietti/penguins-eggs/issues).

* mail: piero.proietti@gmail.com

## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
