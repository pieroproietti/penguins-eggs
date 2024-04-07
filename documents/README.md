# Experimental eggs 9.7.1 pengui 0.71

## Italiano
Ho lavorato un po' sulle exclude.list.

Il concetto è che viene creata una exclude.list in /etc/penguins-eggs.d/ a partire da varie exclude.list presenti in /etc/penguins-eggs.d/exclude.d/.

Le exclude.list di base sono:
* master.list
* home.list
* usr.list
* var.list

Il flag --filters è diventato --excludes e suona meglio, si possono includere ognuna della exclude.list presenti, ad eccezione di master.list.

Inoltre ad --excludes è possibile aggiunrere static, per lavorare con una exclude.list precedentemente creata e --mine, per excludere la home dell'utente corrente.

Una bella possibilità è quella di utilizzare una exclude.list custom nella propria home e poi utilizzarla creando un link a /etc/penguins-eggs.d/exclude.list.

Tutto questo è stato trasposto anche in pengui-0.7.01 che dovrebbe essere di aiuto, anche agli esperti. Ad esempio clicchando sulla excludes static, le altre vengono ovviamente annullate.

M'è venuto così di colpo, sembra funzioni ma è domenica sera e domani al lavoro.

Che ne pensate?

## English

I have been doing some work on exclude.lists.

The concept is that an exclude.list is created in /etc/penguins-eggs.d/ from various exclude.lists in /etc/penguins-eggs.d/exclude.d/.

The basic exclude.lists are:
* master.list
* home.list
* usr.list
* var.list

The --filters flag has become --excludes and sounds better, you can include each of the present exclude.lists except master.list.

Also to --excludes you can add static, to work with a previously created exclude.list, and --mine, to exclude the current user's home.

A nice possibility is to use a custom exclude.list in your home and then use it by creating a link to /etc/penguins-eggs.d/exclude.list.

All of this has also been transposed in pengui-0.7.01 which should be helpful, even to experts. For example, by clicking on the static excludes, the others are obviously cancelled.

It just came to me out of the blue, it seems to work but it is Sunday night and tomorrow at work.

What do you guys think?


Translated with DeepL.com (free version)


