# Nodejs v. 8

From the version eggs-7-5-122 I changed the version of the reference node, returning to the old version nodejs 8. This guarantees the possibility of creating debian packages for both the i386 architecture as well as for amd64. Not everything comes for free, and in order not to have two source lines, I had to switch to node8 also for the amd64 version, you can experience problems using the versions after 7-5.122 if installing node> 8. (For the user is not a big problem, can install the .deb version, for those who collaborate or intend to collaborate on the project, I recommend installing nodejs 8).

# Nodejs on i386 
The last official version for this architecture is Node.js v8.x, we can install it.

## Ubuntu
```curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -```
```sudo apt-get install -y nodejs```

## Debian
```curl -sL https://deb.nodesource.com/setup_8.x | bash -```
```apt-get install -y nodejs```

and finally, we check the nodejs version:

```apt-cache policy nodejs ```

```apt install nodejs=8.17.0-1nodesource1```

to install the nodejs version 8.

After that is better to look apt upgradin of nodejs

just use:

```
sudo apt-mark hold nodejs
```

if You want to remove the hold

```
sudo apt-mark unhold nodejs
```

In this way when you upgrade the system, the version of nodejs10 from the original reporitory of Debian will not be installed.


## node v. 8 vs v. 14

I used very few new caracteristics from the current version, mostly are about fs package.

* isDirectory() from version 10
* isSymbolicLink() from version 10

Well, today I push the node8 vs node14 used things in n8.ts, so now we are again compatible with node8 and can start agein to built eggs i386 packages.

# x86 package node8 
You must to be in a x86 system.

* edit ./node_modules/@oclif/dev-cli/lib/tarballs/config.js
* add 'linux-x86' in TARGET line 53 on config.js

For comodity I put a link: oclif-tarball-config.js to ./node_modules/@oclif/dev-cli/lib/tarballs/config.js, so you can edit this one directly.

At this point run
```
sudo npm run deb
```

## Contacts
Feel free to contact [me](https://gitter.im/penguins-eggs-1/community?source=orgpage) or open an issue on [github](https://github.com/pieroproietti/penguins-eggs/issues).

* mail: piero.proietti@gmail.com

## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
