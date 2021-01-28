eggs(1) -- A reproductive system for penguins
=============================================

<!-- toc -->

<!-- tocstop -->

## SYNOPSIS

eggs command [--flags]

examples:

<!-- usage -->

<!-- usagestop -->

## DESCRIPTION

eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso image.

eggs as CLI tool have his man page but not only - yith his two GUIs: eggs mom and eggs dad - you can help yourself and easily learn eggs commands or get documentations.

## COMMANDS

<!-- commands -->

<!-- commandsstop -->

## FILE
      /etc/penguins-eggs.d
        all eggs configurations are here

      /usr/local/share/penguins-eggs/exclude.list
        exclude.list rsync

      /usr/lib/penguins-eggs (deb package)
        here eggs is installed
      OR
      /usr/lib/node_modules/penguins-eggs/ (npm package)
        here eggs is installed


## TROUBLES
Different versions of eggs can have differents configurations files. This can lead to get errors. A fast workaround for this trouble can be download eggs, remove eggs, remove it's configurations, reinstall new version and run sudo eggs prerequisites:

  **sudo eggs update** # select basket, choose the version and download it but not install!

  **sudo apt --purge eggs** # remove eggs

  **sudo rm /usr/penguins-eggs/ rf** # remove eggs 

  **sudo rm /etc/penguins-eggs.d -rf** # remove eggs configurations files

  **sudo dpkg -i /tmp/eggs_7.7.9-1_amd64.deb** # install eggs from downloaded package

  **sudo eggs prerequisites** # check prerequisites and generate configuration's files

## BUGS

See GitHub Issues: <https://github.com/pieroproietti/penguins-eggs/issues>

## RESOURCES AND DOCUMENTATION
Website: **https://penguins-eggs.net**

Documentation: **https://penguins-eggs.net/book**

GitHub repository & Issue Tracker: **github.com/pieroproietti/penguins-eggs**

## AUTHOR

Piero Proietti <piero.proietti@gmail.com>
