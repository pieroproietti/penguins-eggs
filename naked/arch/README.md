# Archinstall

Boot archiso from virtual machine, then:

```
passwod
```

```
ip a
```

Then, from the host:
```
ssh root@192.168.1.214
```
then

```
archinstall --config https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/naked/arch/eggs_configuration.json \
            --creds https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/naked/arch/eggs_credentials.json \
            --disk_layouts https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/naked/arch/eggs_disk_layout.json
```