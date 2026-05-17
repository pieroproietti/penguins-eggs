# ruby_os_tools

`ruby_os_tools` is a standalone Ruby gem scaffold for OS remastering workflows.
It provides basic distro detection, exclude list generation, and CLI helpers designed to complement the existing `oa-tools` ecosystem.

## Usage

Install from the local repository:

```sh
gem build ruby_os_tools.gemspec
gem install ./ruby_os_tools-0.1.0.gem
```

Run the CLI:

```sh
ruby_os_tools version
ruby_os_tools detect
ruby_os_tools exclude standard
```
