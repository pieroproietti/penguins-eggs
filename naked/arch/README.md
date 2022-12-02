# Archinstall

```
archinstall --config user_configuration.json --creds user_credentians.json --disk_layauts user_disk_layout
```


```
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/naked/arch/user_credentians.json
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/naked/arch/user_disk_layout

archinstall --config https://raw.githubusercontent.com/pieroproietti/penguins-eggs/master/naked/arch/user_configuration.json \
            --creds user_credentians.json \
            --disk_layouts user_disk_layout
```

