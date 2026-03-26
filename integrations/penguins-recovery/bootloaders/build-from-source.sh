#!/bin/bash
# build-from-source.sh -- Clone and build bootloaders from source.
#
# Usage:
#   ./build-from-source.sh [bootloader-name ...]
#
# With no arguments, clones all bootloaders defined in sources.conf.
# With arguments, builds only the named bootloaders.
#
# Cloned sources go into bootloaders/src/<name>/
# Build artifacts go into bootloaders/out/<name>/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCES_CONF="$SCRIPT_DIR/sources.conf"
SRC_DIR="$SCRIPT_DIR/src"
OUT_DIR="$SCRIPT_DIR/out"

info()  { echo -e "\033[1;32m[build]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[build]\033[0m $*"; }
error() { echo -e "\033[1;31m[build]\033[0m $*" >&2; }

if [ ! -f "$SOURCES_CONF" ]; then
    error "sources.conf not found at $SOURCES_CONF"
    exit 1
fi

mkdir -p "$SRC_DIR" "$OUT_DIR"

# Parse filter arguments
FILTER=("$@")

clone_repo() {
    local name="$1" url="$2" branch="$3"
    local dest="$SRC_DIR/$name"

    if [ -d "$dest/.git" ]; then
        info "$name: updating existing clone"
        git -C "$dest" fetch origin
        git -C "$dest" checkout "$branch" 2>/dev/null || git -C "$dest" checkout "origin/$branch"
        git -C "$dest" pull --ff-only 2>/dev/null || true
    else
        info "$name: cloning $url (branch: $branch)"
        if [ "$branch" = "default" ]; then
            git clone --depth 1 "$url" "$dest"
        else
            git clone --depth 1 --branch "$branch" "$url" "$dest"
        fi
    fi
}

build_go() {
    local name="$1" src="$SRC_DIR/$name" out="$OUT_DIR/$name"
    mkdir -p "$out"
    info "$name: building (go)"
    if [ -f "$src/go.mod" ]; then
        (cd "$src" && go build -o "$out/" ./...)
    else
        warn "$name: no go.mod found, skipping build"
    fi
}

build_cargo() {
    local name="$1" src="$SRC_DIR/$name" out="$OUT_DIR/$name"
    mkdir -p "$out"
    info "$name: building (cargo)"
    if [ -f "$src/Cargo.toml" ]; then
        (cd "$src" && cargo build --release)
        cp -r "$src/target/release/"* "$out/" 2>/dev/null || true
    else
        warn "$name: no Cargo.toml found, skipping build"
    fi
}

build_make() {
    local name="$1" src="$SRC_DIR/$name" out="$OUT_DIR/$name"
    mkdir -p "$out"
    info "$name: building (make)"
    if [ -f "$src/Makefile" ] || [ -f "$src/makefile" ] || [ -f "$src/GNUmakefile" ]; then
        # Some projects need configuration first
        if [ -f "$src/configure" ]; then
            (cd "$src" && ./configure --prefix="$out" 2>/dev/null || true)
        fi
        (cd "$src" && make -j"$(nproc)" 2>&1) || warn "$name: make failed (may need manual configuration)"
    else
        warn "$name: no Makefile found, skipping build"
    fi
}

build_meson() {
    local name="$1" src="$SRC_DIR/$name" out="$OUT_DIR/$name"
    mkdir -p "$out"
    info "$name: building (meson)"
    if [ -f "$src/meson.build" ]; then
        (cd "$src" && meson setup builddir --prefix="$out" 2>&1 && meson compile -C builddir 2>&1) \
            || warn "$name: meson build failed (may need dependencies)"
    else
        warn "$name: no meson.build found, skipping build"
    fi
}

build_edk2() {
    local name="$1" src="$SRC_DIR/$name" out="$OUT_DIR/$name"
    mkdir -p "$out"
    info "$name: building (edk2) -- requires EDK2 toolchain"
    if [ -f "$src/edksetup.sh" ]; then
        warn "$name: EDK2 build requires manual setup. Source cloned to $src"
    else
        warn "$name: EDK2 project cloned to $src -- see project README for build instructions"
    fi
}

should_build() {
    local name="$1"
    if [ ${#FILTER[@]} -eq 0 ]; then
        return 0
    fi
    for f in "${FILTER[@]}"; do
        [ "$f" = "$name" ] && return 0
    done
    return 1
}

# Process sources.conf
while IFS= read -r line; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// /}" ]] && continue

    name=$(echo "$line"    | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $1); print $1}')
    url=$(echo "$line"     | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $2); print $2}')
    branch=$(echo "$line"  | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $3); print $3}')
    buildsys=$(echo "$line"| awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $4); print $4}')
    desc=$(echo "$line"    | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $5); print $5}')

    should_build "$name" || continue

    info "=== $name: $desc ==="
    clone_repo "$name" "$url" "$branch"

    case "$buildsys" in
        go)    build_go "$name" ;;
        cargo) build_cargo "$name" ;;
        make)  build_make "$name" ;;
        meson) build_meson "$name" ;;
        edk2)  build_edk2 "$name" ;;
        cmake)
            info "$name: cmake build -- see project README"
            ;;
        *)
            warn "$name: unknown build system '$buildsys', skipping build"
            ;;
    esac

    info ""
done < "$SOURCES_CONF"

info "Done. Sources in $SRC_DIR, artifacts in $OUT_DIR"
