#!/bin/bash

echo "Configurazione del repository di HashiCorp..."

# 1. Scarica la chiave in un file temporaneo (-q per renderlo silenzioso, senza sporcare troppo il log)
wget -q https://apt.releases.hashicorp.com/gpg -O /tmp/hashicorp.gpg

# 2. De-armora la chiave e la salva. 
# Aggiungiamo --yes così se il file esiste già lo sovrascrive senza bloccare lo script chiedendo [Y/n]
sudo gpg --dearmor --yes -o /usr/share/keyrings/hashicorp-archive-keyring.gpg /tmp/hashicorp.gpg

# 3. Pulisce il file temporaneo
rm /tmp/hashicorp.gpg

# 4. Inserisce il repository corretto per la tua versione di Debian
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list > /dev/null

# 5. Aggiorna gli indici apt e installa vagrant dicendo "sì" in automatico (-y)
echo "Aggiornamento indici e installazione di Vagrant..."
sudo apt update
sudo apt install -y vagrant

echo "Installazione completata!"
vagrant --version
