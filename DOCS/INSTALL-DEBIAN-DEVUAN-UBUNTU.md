# Come Installare penguins-eggs su Debian, Ubuntu e derivate

Per installare penguins-eggs sul tuo sistema in modo semplice e per ricevere aggiornamenti automatici, puoi aggiungere il nostro repository APT ufficiale.

Questo processo, basato sulle moderne pratiche di sicurezza, richiede pochi semplici comandi da terminale.

## Passaggio 1: Aggiungere la Chiave GPG del Repository
Per prima cosa, dobbiamo insegnare al tuo sistema a fidarsi del nostro repository. Lo facciamo importando la chiave GPG pubblica con cui sono firmati i pacchetti. Questo garantisce che il software che installi sia autentico e non sia stato modificato.

Esegui questo comando per scaricare e installare la chiave in modo sicuro:

### Scarica la chiave, convertila nel formato corretto e salvala
```
curl -fsSL [https://pieroproietti.github.io/penguins-eggs/penguins-eggs.asc](https://pieroproietti.github.io/penguins-eggs/penguins-eggs.asc) | sudo gpg --dearmor -o /usr/share/keyrings/penguins-eggs-keyring.gpg
```

## Passaggio 2: Aggiungere il Repository alla Lista delle Sorgenti
Ora, dobbiamo dire ad apt (il gestore di pacchetti) dove trovare i nostri pacchetti. Creeremo un nuovo file di configurazione che punta al nostro repository.

Esegui questo comando per creare il file:

### Aggiunge il repository alla configurazione di APT, legandolo alla chiave che abbiamo appena importato
```
echo "deb [signed-by=/usr/share/keyrings/penguins-eggs-keyring.gpg] [https://pieroproietti.github.io/penguins-eggs/deb](https://pieroproietti.github.io/penguins-eggs/deb) stable main" | sudo tee /etc/apt/sources.list.d/penguins-eggs.list > /dev/null
```
## Passaggio 3: Installare penguins-eggs
Il tuo sistema ora conosce il nostro repository ed è in grado di verificarne l'autenticità. Per installare il pacchetto, aggiorna la cache dei pacchetti e installa penguins-eggs con i seguenti comandi:

```
sudo apt-get update
sudo apt-get install penguins-eggs
```
Fatto! penguins-eggs è ora installato sul tuo sistema. Ogni volta che eseguirai un aggiornamento di sistema (sudo apt-get upgrade), riceverai automaticamente la versione più recente di penguins-eggs.