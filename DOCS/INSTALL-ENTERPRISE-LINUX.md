# Come Installare penguins-eggs su Enterprise linux (e sistemi derivati)

Per installare penguins-eggs sul tuo sistema Enterprise linux: AlmaLinux, Rocky Linux o qualsiasi altra distribuzione basata su dnf/yum, puoi aggiungere il nostro repository RPM ufficiale. Questo ti garantirà un'installazione semplice e aggiornamenti automatici.

Il processo richiede pochi comandi da terminale.

## Passaggio 1: Importare la Chiave GPG del Repository
Per prima cosa, dobbiamo importare la chiave GPG con cui sono firmati i pacchetti. Questo garantisce al tuo sistema che il software che installi è autentico e non è stato modificato.

Esegui questo comando per importare la chiave:
```
sudo rpm --import https://pieroproietti.github.io/penguins-eggs/rpm/RPM-GPG-KEY-penguins-eggs
```

## Passaggio 2: Aggiungere il Repository di penguins-eggs
Ora, dobbiamo dire a dnf dove trovare i nostri pacchetti. Creeremo un nuovo file di configurazione per il repository.

Esegui questo comando per creare e aprire il file con l'editor nano:
```
sudo nano /etc/yum.repos.d/penguins-eggs.repo
```
Incolla il seguente testo all'interno dell'editor:
```
[penguins-eggs]
name=Penguins-eggs Repository
baseurl=https://pieroproietti.github.io/penguins-eggs/rpm/el/9
enabled=1
gpgcheck=1
gpgkey=https://pieroproietti.github.io/penguins-eggs/rpm/RPM-GPG-KEY-penguins-eggs
```
Nota per gli utenti non-Fedora: Puoi sostituire fedora/42 con la cartella appropriata per il tuo sistema (es. el/9 per AlmaLinux/Rocky 9).

Salva il file e chiudi l'editor (in nano, premi Ctrl+X, poi Y e Invio).

## Passaggio 3: Installare penguins-eggs
Il tuo sistema ora conosce il nostro repository. Per installare il pacchetto, aggiorna la cache dei pacchetti e installa penguins-eggs con i seguenti comandi:
```
sudo dnf makecache
sudo dnf install penguins-eggs
```
Fatto! penguins-eggs è ora installato sul tuo sistema. Ogni volta che eseguirai un aggiornamento di sistema (sudo dnf upgrade), riceverai automaticamente la versione più recente di penguins-eggs.