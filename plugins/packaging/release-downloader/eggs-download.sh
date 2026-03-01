#!/bin/bash
# eggs-download.sh
# Lightweight release downloader for penguins-eggs.
# Inspired by RaduAnPlay/Github-paser.
#
# Usage:
#   ./eggs-download.sh                    # download latest for current arch
#   ./eggs-download.sh --version 10.0.0   # specific version
#   ./eggs-download.sh --list             # list available releases

set -euo pipefail

REPO="pieroproietti/penguins-eggs"
API_URL="https://api.github.com/repos/${REPO}/releases"
DEST_DIR="${DEST_DIR:-.}"

# Detect architecture
detect_arch() {
  local arch
  arch=$(uname -m)
  case "$arch" in
    x86_64)  echo "amd64" ;;
    aarch64) echo "arm64" ;;
    armv7l)  echo "armhf" ;;
    i686)    echo "i386" ;;
    *)       echo "$arch" ;;
  esac
}

# Detect preferred package format
detect_format() {
  if command -v dpkg >/dev/null 2>&1; then
    echo "deb"
  elif command -v rpm >/dev/null 2>&1; then
    echo "rpm"
  else
    echo "AppImage"
  fi
}

# Fetch JSON from GitHub API
fetch_json() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$url"
  else
    echo "Error: curl or wget required" >&2
    exit 1
  fi
}

# Download a file
download_file() {
  local url="$1"
  local dest="$2"
  echo "Downloading: $(basename "$dest")"
  if command -v curl >/dev/null 2>&1; then
    curl -fSL --progress-bar "$url" -o "$dest"
  elif command -v wget >/dev/null 2>&1; then
    wget --show-progress -q "$url" -O "$dest"
  fi
}

# List available releases
list_releases() {
  local json
  json=$(fetch_json "${API_URL}?per_page=10")
  echo "Recent penguins-eggs releases:"
  echo "$json" | grep -oP '"tag_name":\s*"\K[^"]+' | while read -r tag; do
    echo "  $tag"
  done
}

# Get download URL for a specific version and format
get_download_url() {
  local version="$1"
  local arch="$2"
  local format="$3"
  local json

  if [ "$version" = "latest" ]; then
    json=$(fetch_json "${API_URL}/latest")
  else
    json=$(fetch_json "${API_URL}/tags/v${version}" 2>/dev/null || \
           fetch_json "${API_URL}/tags/${version}")
  fi

  # Find matching asset
  local pattern
  case "$format" in
    deb) pattern="penguins-eggs.*${arch}\.deb" ;;
    rpm) pattern="penguins-eggs.*${arch}\.rpm" ;;
    *)   pattern="penguins-eggs.*\.AppImage" ;;
  esac

  echo "$json" | grep -oP '"browser_download_url":\s*"\K[^"]+' | grep -iE "$pattern" | head -1
}

# Main
main() {
  local version="latest"
  local action="download"

  while [ $# -gt 0 ]; do
    case "$1" in
      --version|-V) version="$2"; shift 2 ;;
      --list|-l)    action="list"; shift ;;
      --dest|-d)    DEST_DIR="$2"; shift 2 ;;
      --help|-h)
        echo "Usage: eggs-download.sh [--version VERSION] [--list] [--dest DIR]"
        exit 0
        ;;
      *) shift ;;
    esac
  done

  case "$action" in
    list)
      list_releases
      ;;
    download)
      local arch format url filename
      arch=$(detect_arch)
      format=$(detect_format)

      echo "System: $(uname -m) -> ${arch}, format: ${format}"
      echo "Fetching ${version} release..."

      url=$(get_download_url "$version" "$arch" "$format")
      if [ -z "$url" ]; then
        echo "Error: No matching release found for ${arch}/${format}" >&2
        exit 1
      fi

      filename=$(basename "$url")
      mkdir -p "$DEST_DIR"
      download_file "$url" "${DEST_DIR}/${filename}"

      echo "Downloaded: ${DEST_DIR}/${filename}"

      # Verify checksum if available
      local checksum_url="${url}.sha256"
      if curl -fsSL --head "$checksum_url" >/dev/null 2>&1; then
        echo "Verifying checksum..."
        local checksum
        checksum=$(fetch_json "$checksum_url")
        echo "$checksum  ${DEST_DIR}/${filename}" | sha256sum -c - 2>/dev/null && \
          echo "Checksum OK" || echo "Warning: checksum verification failed"
      fi
      ;;
  esac
}

main "$@"
