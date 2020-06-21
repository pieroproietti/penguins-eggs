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


## node v. 8 vs v. 14

I used very few new caracteristics from the current version, mostly are about fs package.

* isDirectory() from version 10
* isSymbolicLink() from version 10


You can try to wrap when in something compatible with v. 8x. 

Sorry at the moment I don't have time, but if You are interested I can help You.

## Contacts
Feel free to contact [me](https://gitter.im/penguins-eggs-1/community?source=orgpage) or open an issue on [github](https://github.com/pieroproietti/penguins-eggs/issues).

* mail: piero.proietti@gmail.com

## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
