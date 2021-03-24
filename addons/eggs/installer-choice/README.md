# Installer choices

Questo addon è nato per permettere ad Andrea Carbonaro di scegliere il tipo di installazione.

Difatti, pur se è consigliabile utilizzare calamares, vi sono casi in cui l'installazione
cli può essere preferibile.

Il caso specifico è quando la macchina non riesce o, riesce lentissimamente, ad utilizzare 
calamares.

Tenete però presenti alcune limitazioni di eggs install e cioè:

* l'installazione cancellerà completamente il disco utilizzato con la perdita dei vostri 
dati nel caso non abbiate provveduto al loro salvataggio su un altro disco;

* l'interfaccia, per quanto migliorata, può risultare scarna per un utente medio;

* stante la completa cancellazione del disco di boot, non è possibile la convivenza con 
Windows


## Installer choice
E' composto di 2 cartelle
* applications
* bin

In applications è presente il link per il desktop, in bin lo script. 
Non è presente una cartella artwork in quanto l'addon utilizza 
system-software-install come icona.

