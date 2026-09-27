# AppImage (C/Go)

Build on x86_64 Linux as a normal user:

```sh
make appimage
bash packaging/appimage/smoke-test.sh dist/appimage/*.AppImage
```

Requires Go (see `coa/go.mod`), GCC, static libc/libcrypt development libraries,
make, curl, squashfs-tools and desktop-file-utils. The build downloads
appimagetool 1.9.1 and the continuous type-2 runtime. For offline or reproducible
builds provide verified local paths using `APPIMAGETOOL` and `APPIMAGE_RUNTIME`.
The output and SHA-256 checksum are under `dist/appimage/`.

Hammers uploads the same files as the `penguins-eggs-appimage-x86_64` artifact.
This job does not publish a GitHub Release automatically; attach the `.AppImage`
file directly to a release when ready for the AppImage catalog.

## Run

```sh
chmod +x penguins-eggs-*-x86_64.AppImage
./penguins-eggs-*-x86_64.AppImage version
./penguins-eggs-*-x86_64.AppImage --help
```

Both oa and coa are statically linked; Node.js is not needed. This first build
supports x86_64 only. The AppImage runtime normally uses FUSE; without FUSE use
`APPIMAGE_EXTRACT_AND_RUN=1 ./penguins-eggs-…-x86_64.AppImage version`.

## Prepare a remaster VM

The remaster plans use resources in `/etc/penguins-eggs.d`, and the resulting
live system needs persistent binaries for its installer. Therefore remastering
requires an explicit installation first (this is not a fully portable remaster):

```sh
sudo ./penguins-eggs-*-x86_64.AppImage --install-system
sudo eggs remaster
```

Installation writes coa, oa and the eggs symlink to `/usr/local/bin`, updates
shipped brain modules, scripts and default branding in `/etc/penguins-eggs.d`,
and installs SpacemiT resources in `/usr/share/penguins-eggs`. Existing
`custom.yaml`, `custom.exclude.list` and user branding are preserved. The local
binaries take precedence over distro packages in a normal PATH; use a dedicated
VM to test this distribution format.

Runtime distribution dependencies (boot, filesystem and ISO tools) must still
be installed. Bootloaders retain the application's existing download behavior.
This bundle does not register a native package or install dependencies.
The smoke test verifies CLI startup, static linking, resource presence and engine
startup without executing system mutations; full remaster and boot testing in a
VM remains necessary.
