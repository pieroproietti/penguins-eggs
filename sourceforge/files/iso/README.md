# Penguin's eggs remastered ISOs

All ISOs are based on Debian Buster, Ubuntu Focal and Deepin 20 Beta. 

# user/password
* ```live/evolution```
* ```root/evolution```

All the ISOs include nodejs and eggs installed (.npm package), so you can
update your eggs tool with the command:

```sudo eggs update```

# ISOs

I work mostly on Debian stable, so here you can find my personal versions and other examples.

## Debian Buster
* **debu**  - it is my personal version with cinnamon, mostly for development, but include common office tools;
* **lampp** - same as debu, but with tools to develop web sites with php and wordpress;
* **naked** - just the juice, without GUI, with nodejs and eggs. You can start here to build your revolution! 
* **less** - it's just naked, dressed with lxde-core and the tools to work.
* **blockchain** - I'm not a blockchain expert, the idea is to give an example of that is possible to build with eggs. I mean an an ISO image to giveup to * students for learn blockchain, develop smart contracts, etc. Feel free to give suggestions on it or ask for help to build your own version.
* **incubator** - Debian Buster + Proxmox VE 6.2 and the same tools of debu;

## Linux Mint Debian Edition 4
* **lmde4** - LMDE4 Debbie, remastered with eggs, without any modifications except for develop tools.

### Deepin 20 beta
* **dpin** - deepin 20 beta apricot remastered with eggs, without any modifications except for develop tools.

## Ubuntu 20.04 focal
* **ufo-mini** - Ubuntu focal minimal installation, remastered with eggs, without any modifications except for develop tools.

### Linux Mint 19.3 (Ubuntu eoan based)
* **tricia** - Linux Mint 19.3 remastered with eggs, without any modifications except for develop tools.


# Collaboration

A suitable way to start to collaborate in penguin's eggs development can be install debu, and play
with penguins-eggs source.

It is quite simple, just download penguins-eggs sources

```git clone https://github.com/pieroproietti/penguins-eggs```


Install the npm packcageg on it 

```cd penguins-egg```

```npm i```

Now, from the same directory, you can use eggs from sources:

```~/penguins-eggs$ .\eggs info```

```~/penguins-eggs$ sudo .\eggs produce -fv```



