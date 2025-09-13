# Come Installare penguins-eggs su openSUSE (Leap)

Per installare penguins-eggs sul tuo sistema openSUSE in modo semplice e per ricevere aggiornamenti automatici, puoi aggiungere il nostro repository RPM ufficiale.

Il processo richiede pochi semplici comandi da terminale.

## Passaggio 1: Importare la Chiave GPG del Repository
Per prima cosa, dobbiamo importare la chiave GPG con cui sono firmati i pacchetti. Questo garantisce al tuo sistema che il software che installi è autentico e sicuro.

Esegui questo comando per importare la chiave:

```
sudo rpm --import https://pieroproietti.github.io/penguins-eggs/rpm/RPM-GPG-KEY-penguins-eggs
```

## Passaggio 2: Aggiungere il Repository di penguins-eggs
Ora, dobbiamo dire a zypper (il gestore di pacchetti di openSUSE) dove trovare i nostri pacchetti. Creeremo un nuovo file di configurazione per il repository.

Esegui questo comando per aprire un editor di testo e creare il file:
```
sudo nano /etc/zypp/repos.d/penguins-eggs.repo
```
Incolla il seguente testo all'interno dell'editor:
```
[penguins-eggs]
name=Penguins-eggs Repository
baseurl=https://pieroproietti.github.io/penguins-eggs/rpm/opensuse/leap/](https://pieroproietti.github.io/penguins-eggs/rpm/opensuse/leap/
enabled=1
gpgcheck=1
gpgkey=https://pieroproietti.github.io/penguins-eggs/rpm/RPM-GPG-KEY-penguins-eggs
autorefresh=1
type=rpm-md
```
Salva il file e chiudi l'editor (in nano, premi Ctrl+X, poi Y e Invio).

## Passaggio 3: Installare penguins-eggs
Il tuo sistema ora conosce il nostro repository. Per installare il pacchetto, aggiorna la cache dei pacchetti e installa penguins-eggs con i seguenti comandi:
```
sudo zypper refresh
sudo zypper install penguins-eggs
```
Fatto! penguins-eggs è ora installato sul tuo sistema. Ogni volta che eseguirai un aggiornamento di sistema (sudo zypper up), riceverai automaticamente la versione più recente di penguins-eggs.