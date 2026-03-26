# Rescue Image

Build a minimal and opinionated rescue unified system image (USI), i.e. a single EFI executable containing a minimal yet complete system for recovery.

## Why?

You tinker, things break. They say every Arch Linux user carries a USB stick with the installation disk around, just in case.

With this image, you don't need to. Put the image on your ESP, and boot it rescue your Linux installation.

## How?

Make sure you have recent versions of `mkosi` and `systemd-ukify` installed.

First, set a root password:

```console
$ printf "hashed:%s\n" "$(openssl passwd -6)" > mkosi.rootpw
$ chmod 600 mkosi.rootpw
```

Note: Without this step you **cannot** log in on the rescue image, so don't forget it.
Alternatively,

- write `hashed:` to `mkosi.rootpw` to make `root` have an empty password, or
- pass `--autologin` when building the image (see below) to have root automatically login on the first console (at your own risk!).

Then, build the image:

```console
$ mkosi build
```

Note: If you did not set up user namespaces, you have to run the above command as root.

Then, put the image on your EFI partition (or on the XBOOTLDR partition if your EFI system partition is too small):

```console
# install -m644 -t /efi/EFI/Linux mkosi.output/*.efi
```

If you place it in `EFI/Linux` systemd-boot will discover it automatically without further configuration.

### Secure boot

After installing the rescue image to `/efi` you can sign it for secure boot, e.g. with `sbctl sign`.

`mkosi` can also sign the image by itself, using `sbsigntools`.
For this you need to set `SecureBootKey=` and `SecureBootCertificate=`, e.g in `mkosi.local.conf`.

## License

Copyright Sebastian Wiesner <sebastian@swsnr.de>

The code in this repository is licensed under the EUPL, see <https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12>.

Packages inside the generated rescue image are covered by their respective licenses;
as a result the final rescue image may be covered by a different license.
