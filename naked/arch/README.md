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
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/naked/arch/user_credentials.json
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/naked/arch/user_disk_layout.json
archinstall --config https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/naked/arch/user_configuration.json \
            --creds user_credentials.json \
            --disk_layouts user_disk_layout.json
```
