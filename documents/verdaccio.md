# Installazione docker

## abilitare docker e contained 
```
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
```
# installazione ed avvio al boot
```
sudo docker pull verdaccio/verdaccio
sudo docker run -d --restart unless-stopped --name versaccio -p 4873:4873 verdaccio/verdaccio
```
# Comandi per controllare il container
```
sudo docker container list
sudo docker container logs 9f3ff0b8002b
```

# connet to the container

```
sudo docker exec -u 0 -it 9f3ff0b8002b /bin/sh
```

# Settare npm per usare il registri privato

Normalmente npm scarica i pacchetti da https://www.npmjs.com/,
per configurarlo sul nostro registri:

```
npm set registry http://192.168.61.2:4873/
```

Per loggarsi sul registry privato e pubblicare un pacchetto:
```
npm adduser --registry http://192.168.61.2:4873/
```

Spero/credo che verdaccio mi aiuterà non poco!!!

