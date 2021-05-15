# Architettura i386 node 8.17.0


## Compilazione con node8 per architettura i386

Conviene utilizzare "globby": "10.0.2", dalla 11.0.0 in poi occorre...

Aprire il link globby index e modificare la riga 28

code ./node_modules/globby/index.js:28

modificare linea 28 da:
	} catch {
a:
    } catch (_) {

A questo punto i comandi vengono caricati ed eseguiti.

Non essendo possibile fissare i plugin, pur andando a versioni precedenti,
e rimuovendoli da comunque errore, li lascio inalterati

* oclif-plugin-autocomplete
* oclif-plugin-not-found
* plugin-warn-if-update-available


autocomplete è ok, viene sostituito dalla copia di eggs.bash in /etc/bash_completion.d

Aprire il link config.ts e modificare i TARGET, alla riga 8, aggiungendo

const TARGETS = [
    'linux-x86',
   // 'linux-arm',
    'win32-x64',
    'win32-x86',
    'darwin-x64',
];

## Editing su i386

Per i386 ne code, ne atom - entrambi a 64 bit funzionano. Per un lungo periodo ho utilizzato l'ottimo sublime ma,
sempre con una certa difficoltà. Attualmente utilizzo lo scarno ma potente [lite](https://github.com/rxi/lite) un editor brasiliano basato su LUA,
che utilizzo soprattutto per la similitudine estetica con code.

Una avvertenza, la chiusura delle finestre in lite non avviene con tasto destro del mouse ma con CTRL-w.

E' un buon prodotto, per me un editor secondario che non conosco bene, però mi consente di modificare le poche differenze tra la versione
amd64 e quella i386 con uno strumento che non mi confonde.




