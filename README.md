krill
=================

A new CLI generated with oclif


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/krill.svg)](https://npmjs.org/package/krill)
[![Downloads/week](https://img.shields.io/npm/dw/krill.svg)](https://npmjs.org/package/krill)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g krill
$ krill COMMAND
running command...
$ krill (--version)
krill/0.0.0 linux-x64 node-v20.5.1
$ krill --help [COMMAND]
USAGE
  $ krill COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`krill hello PERSON`](#krill-hello-person)
* [`krill hello world`](#krill-hello-world)
* [`krill help [COMMAND]`](#krill-help-command)
* [`krill plugins`](#krill-plugins)
* [`krill plugins add PLUGIN`](#krill-plugins-add-plugin)
* [`krill plugins:inspect PLUGIN...`](#krill-pluginsinspect-plugin)
* [`krill plugins install PLUGIN`](#krill-plugins-install-plugin)
* [`krill plugins link PATH`](#krill-plugins-link-path)
* [`krill plugins remove [PLUGIN]`](#krill-plugins-remove-plugin)
* [`krill plugins reset`](#krill-plugins-reset)
* [`krill plugins uninstall [PLUGIN]`](#krill-plugins-uninstall-plugin)
* [`krill plugins unlink [PLUGIN]`](#krill-plugins-unlink-plugin)
* [`krill plugins update`](#krill-plugins-update)

## `krill hello PERSON`

Say hello

```
USAGE
  $ krill hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ krill hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/pieroproietti/krill/blob/v0.0.0/src/commands/hello/index.ts)_

## `krill hello world`

Say hello world

```
USAGE
  $ krill hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ krill hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/pieroproietti/krill/blob/v0.0.0/src/commands/hello/world.ts)_

## `krill help [COMMAND]`

Display help for krill.

```
USAGE
  $ krill help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for krill.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.22/src/commands/help.ts)_

## `krill plugins`

List installed plugins.

```
USAGE
  $ krill plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ krill plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/index.ts)_

## `krill plugins add PLUGIN`

Installs a plugin into krill.

```
USAGE
  $ krill plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into krill.

  Uses bundled npm executable to install plugins into /home/artisan/.local/share/krill

  Installation of a user-installed plugin will override a core plugin.

  Use the KRILL_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the KRILL_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ krill plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ krill plugins add myplugin

  Install a plugin from a github url.

    $ krill plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ krill plugins add someuser/someplugin
```

## `krill plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ krill plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ krill plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/inspect.ts)_

## `krill plugins install PLUGIN`

Installs a plugin into krill.

```
USAGE
  $ krill plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into krill.

  Uses bundled npm executable to install plugins into /home/artisan/.local/share/krill

  Installation of a user-installed plugin will override a core plugin.

  Use the KRILL_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the KRILL_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ krill plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ krill plugins install myplugin

  Install a plugin from a github url.

    $ krill plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ krill plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/install.ts)_

## `krill plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ krill plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ krill plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/link.ts)_

## `krill plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ krill plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ krill plugins unlink
  $ krill plugins remove

EXAMPLES
  $ krill plugins remove myplugin
```

## `krill plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ krill plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/reset.ts)_

## `krill plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ krill plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ krill plugins unlink
  $ krill plugins remove

EXAMPLES
  $ krill plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/uninstall.ts)_

## `krill plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ krill plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ krill plugins unlink
  $ krill plugins remove

EXAMPLES
  $ krill plugins unlink myplugin
```

## `krill plugins update`

Update installed plugins.

```
USAGE
  $ krill plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/update.ts)_
<!-- commandsstop -->
