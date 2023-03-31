# Test su manifest 


Seleziona un comando:
```
.commands[] | select(.id =="calamares")
```

getFlagsNames() {
[jq]> .commands[] | select(.id=="calamares").flags[] | .name
}



in bash?
.commands[] | select(.id =="$answer")

# project eggs TUI/GUI

# Tools
* [jq](https://stedolan.github.io/jq/) jq original
* [yq](https://github.com/mikefarah/yq) a lightweight and portable command-line YAML, JSON and XML processor.
* [jiq](https://github.com/fiatjaf/jiq) you can drill down interactively by using jq filtering queries.

# References
* [pure-bash-bible](https://github.com/dylanaraps/pure-bash-bible#table-of-contents)

# Plan
I want to get something like that - note we discard help and nointeractive -:

## main menu

```
===================================================
eggs

On the road of Remastersys, Refracta, Systemback and father Knoppix!

adapt
calamares
dad
help
kill
install
produce
syncfrom
syncto
status
update
export
tools
```
After we will select one choise, we will go in a form for the command. I just create same samples: calamares, install and produce.

## calamares
```
===================================================
calamares

calamares configuration or install and configure it
[ ] install 
[ ] release 
[ ] remove
[ ] theme: ________________
[ ] verbose
```

## install
```
===================================================
install

krill TUI system installer - the egg becomes a chick
[ ] none
[ ] suspend
[ ] custom: ________________
[ ] domain: ________________
[ ] ip
[ ] crypted
[ ] pve
[ ] random
[ ] small
[ ] unattended
[ ] verbose
```

## produce
```
===================================================
produce

the system produces an egg: iso image of your system

[ ] backup
[ ] basename: ________________
[ ] clone
[ ] fast
[ ] max
[ ] prefix: ________________
[ ] release
[ ] script
[ ] theme: ________________
[ ] verbose
[ ] yolk
```

# .oclif.manifest.json

After wrote the entire mom.yaml I realized there is the opportunity of use the file .oclif.manifest.json this is automatically generated and update when I create eggs package.

# problems
I can't find a way to select the contents of command, if not by: 
```
flags=$(jq '.options.menuEntry[0].flags' eggs.json )
```
I see in manifest, they use objects inside object with a field: id, can be a solution? I don't know.

It's very interesting for me to use jq or yt, especially thinking I can build an approch starting from manifest.yaml, but at the moment not capable to go too inside.

But if you will continue in same way, I will jump on again.
