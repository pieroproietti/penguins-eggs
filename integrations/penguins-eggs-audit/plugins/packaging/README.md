# Packaging Plugins

Simplified eggs installation and selective downloads.

## Plugins

| Plugin | Project | Status |
|---|---|---|
| gitpack-install | dominiksalvet/gitpack | Planned |
| release-downloader | RaduAnPlay/Github-paser | Planned |
| dir-downloader | Alex313031/github-directory-downloader | Planned |

## gitpack-install

Install eggs directly from its GitHub repo via gitpack. Requires adding
`.install/` directory with install.sh, uninstall.sh, and version file.

## release-downloader

Lightweight bash script to download the latest eggs .deb/.rpm/.appimage
from GitHub releases. No dependencies beyond curl/wget.

## dir-downloader

Download specific wardrobe directories without cloning the full repo.
Powers `eggs wardrobe get <url>` command.
