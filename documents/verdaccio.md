# Installazione

```
sudo docker pull verdaccio/verdaccio
sudo docker run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio
```

Resta da capire come avviarlo allo start

```
sudo systemctl enable docker.service
sudo systemctl enable containerd.service


avvio verdaccio al boot
```
sudo docker run -d --restart unless-stopped --name versaccio -p 4873:4873 verdaccio/verdaccio
```

npm adduser --registry http://192.168.61.2:4873/
npm set registry http://192.168.61.2:4873/
