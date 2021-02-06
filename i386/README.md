# Architettura i386 node 8.17.0


# Compilazione con node8 per architettura i386

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

Aprire il link oclif-tarball-config.js e modificare i TARGET, alla riga 8, aggiungendo

const TARGETS = [
    'linux-x86',
    'win32-x64',
    'win32-x86',
    'darwin-x64',
];

