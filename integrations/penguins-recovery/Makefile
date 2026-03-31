.PHONY: help bootloaders debian arch uki uki-lite verity-uki buildroot gpt-image mbr-image lifeboat rescatux rescapp adapt adapt-rootless erofs-check btrfs-rescue embiggen clean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-20s %s\n", $$1, $$2}'

# === Standalone Builders ===

bootloaders: ## Package system bootloaders into bootloaders.tar.gz
	cd bootloaders && bash create-bootloaders

bootloaders-src: ## Clone and build bootloaders from source
	cd bootloaders && bash build-from-source.sh

bootloaders-all: bootloaders-src bootloaders ## Build source bootloaders then package everything

debian: ## Build Debian-based rescue ISO (requires root, debootstrap)
	cd builders/debian && sudo ./make

arch: ## Build Arch-based rescue ISO (requires mkarchiso)
	cd builders/arch && sudo mkarchiso -v -w /tmp/archiso-work -o out .

uki: ## Build UKI rescue EFI image (requires mkosi, systemd-ukify)
	cd builders/uki && mkosi build

uki-lite: ## Build lightweight rescue UKI from host kernel (requires binutils, EFI stub)
	cd builders/uki-lite && sudo ./build.sh --output rescue.efi

verity-uki: ## Build dm-verity verified, Secure Boot-signed recovery UKI
	@# Usage: make verity-uki [SIGN=1] [KEY=path/to/db.key] [CERT=path/to/db.crt]
	@# Usage: make verity-uki SQUASHFS=path/to/recovery.squashfs
	cd builders/verity-uki && sudo ./build.sh \
		$(if $(SQUASHFS),--squashfs "$(SQUASHFS)") \
		$(if $(SIGN),--key "$(KEY)" --cert "$(CERT)",--no-sign) \
		$(if $(OUTPUT),--output "$(OUTPUT)")

verity-uki-check-deps: ## Check dependencies for verity-uki builder
	@echo "Checking verity-uki dependencies..."
	@for tool in mksquashfs veritysetup objcopy sbsign; do \
		if command -v $$tool >/dev/null 2>&1; then \
			echo "  ✓ $$tool"; \
		else \
			echo "  ✗ $$tool (missing)"; \
		fi; \
	done
	@echo ""
	@echo "Install missing: apt install squashfs-tools cryptsetup-bin binutils sbsigntool"

buildroot: ## Build cross-compiled recovery image using Buildroot. Usage: make buildroot BUILDROOT=/path/to/buildroot [ARCH=x86_64|aarch64] [FORMAT=squashfs|erofs]
	@if [ -z "$(BUILDROOT)" ]; then echo "Usage: make buildroot BUILDROOT=/path/to/buildroot [ARCH=x86_64] [FORMAT=squashfs]"; exit 1; fi
	cd builders/buildroot && sudo ./build.sh \
		--buildroot "$(BUILDROOT)" \
		$(if $(ARCH),--arch "$(ARCH)") \
		$(if $(FORMAT),--format "$(FORMAT)") \
		$(if $(OUTPUT),--output "$(OUTPUT)") \
		$(if $(JOBS),--jobs "$(JOBS)")

gpt-image: ## Build bootable GPT disk image (UEFI). Usage: make gpt-image [EFI=path] [ROOTFS=path] [OUTPUT=recovery.hdd] [VHD=1]
	cd builders/gpt-image && ./build.sh \
		$(if $(EFI),--efi "$(EFI)") \
		$(if $(ROOTFS),--rootfs "$(ROOTFS)") \
		$(if $(OUTPUT),--output "$(OUTPUT)") \
		$(if $(VHD),--vhd) \
		$(if $(SRC_DIR),--src-dir "$(SRC_DIR)")

mbr-image: ## Build legacy BIOS MBR disk image. Usage: make mbr-image ROOTFS=path/to/rootfs.squashfs [OUTPUT=recovery-mbr.img]
	@if [ -z "$(ROOTFS)" ]; then echo "Usage: make mbr-image ROOTFS=path/to/rootfs.squashfs [OUTPUT=recovery-mbr.img]"; exit 1; fi
	cd builders/mbr-image && ./build.sh \
		--rootfs "$(ROOTFS)" \
		$(if $(OUTPUT),--output "$(OUTPUT)") \
		$(if $(PARTYMIX_SRC),--src-dir "$(PARTYMIX_SRC)") \
		$(if $(PARTYMIX_BIN),--bin "$(PARTYMIX_BIN)")

lifeboat: ## Build Alpine-based single-file UEFI rescue EFI (requires gcc, make, wget, fakeroot)
	cd builders/lifeboat && $(MAKE) build

rescatux: ## Build Rescatux ISO (requires live-build, root)
	cd builders/rescatux && sudo ./make-rescatux.sh

rescapp: ## Install rescapp (requires Python3, PyQt5, kdialog)
	cd tools/rescapp && sudo make install

# === Adapter (layer recovery onto penguins-eggs naked ISOs) ===

adapt: ## Layer recovery onto naked ISO. Usage: make adapt INPUT=<iso> [OUTPUT=<iso>] [RESCAPP=1] [SECUREBOOT=1] [GUI=minimal|touch|full]
	@if [ -z "$(INPUT)" ]; then echo "Usage: make adapt INPUT=path/to/naked.iso [OUTPUT=recovery.iso] [RESCAPP=1] [SECUREBOOT=1] [GUI=minimal|touch|full]"; exit 1; fi
	sudo ./adapters/adapter.sh --input "$(INPUT)" \
		$(if $(OUTPUT),--output "$(OUTPUT)") \
		$(if $(RESCAPP),--with-rescapp) \
		$(if $(SECUREBOOT),--secureboot) \
		$(if $(GUI),--gui "$(GUI)")

adapt-rootless: ## Layer recovery onto naked ISO without root (uses fuse-overlayfs). Usage: make adapt-rootless INPUT=<iso> OUTPUT=<iso>
	@if [ -z "$(INPUT)" ] || [ -z "$(OUTPUT)" ]; then \
		echo "Usage: make adapt-rootless INPUT=path/to/naked.iso OUTPUT=recovery.iso"; exit 1; fi
	./adapters/fuse-overlay/fuse-overlay-adapter.sh \
		--input "$(INPUT)" \
		--output "$(OUTPUT)" \
		$(if $(UID_MAP),--uid-map "$(UID_MAP)") \
		$(if $(GID_MAP),--gid-map "$(GID_MAP)")

adapt-rootless-check: ## Check fuse-overlayfs availability for rootless adaptation
	./adapters/fuse-overlay/fuse-overlay-adapter.sh --check

# === Recovery Scripts ===

btrfs-rescue: ## Run Btrfs-aware rescue operations. Usage: make btrfs-rescue CMD=chroot PART=/dev/sda3
	@if [ -z "$(CMD)" ] || [ -z "$(PART)" ]; then \
		echo "Usage: make btrfs-rescue CMD=<command> PART=<partition>"; \
		echo "Commands: chroot list-subvols list-snapshots rollback check scrub-status detect-layout"; \
		exit 1; fi
	sudo ./common/scripts/btrfs-rescue.sh "$(CMD)" "$(PART)" $(if $(SNAP),"$(SNAP)")

erofs-check: ## Check an EROFS image. Usage: make erofs-check IMAGE=path/to/image.erofs
	@if [ -z "$(IMAGE)" ]; then echo "Usage: make erofs-check IMAGE=path/to/image.erofs"; exit 1; fi
	./common/scripts/erofs-rescue.sh check "$(IMAGE)"

erofs-kernel-check: ## Check if running kernel supports EROFS
	./common/scripts/erofs-rescue.sh kernel-check

embiggen: ## Expand a partition to fill available disk space. Usage: make embiggen DEVICE=/dev/sda1
	@if [ -z "$(DEVICE)" ]; then echo "Usage: make embiggen DEVICE=/dev/sda1  OR  make embiggen DEVICE=/"; exit 1; fi
	sudo ./common/scripts/embiggen-disk.sh "$(DEVICE)"

embiggen-check: ## Show unallocated disk space without resizing
	./common/scripts/embiggen-disk.sh --check

# === Cleanup ===

clean: ## Remove build artifacts
	rm -rf bootloaders/bootloaders bootloaders/bootloaders.tar.gz
	rm -rf bootloaders/src bootloaders/out
	rm -rf builders/debian/rootdir builders/debian/*.iso
	rm -rf builders/arch/work builders/arch/out
	rm -rf builders/uki/mkosi.builddir builders/uki/mkosi.cache
	rm -f builders/uki-lite/rescue.efi
	rm -f builders/verity-uki/recovery-verified.efi
	rm -f builders/verity-uki/recovery.squashfs
	rm -f builders/verity-uki/recovery.squashfs.verity
	rm -f builders/verity-uki/root-hash.txt builders/verity-uki/salt.txt
	rm -rf builders/lifeboat/build/alpine-minirootfs* builders/lifeboat/build/linux*
	rm -f builders/lifeboat/build/config.initramfs_root
	rm -f builders/lifeboat/dist/LifeboatLinux.efi
	rm -rf builders/rescatux/rescatux-release
	rm -rf recovery-manager/target
	rm -rf /tmp/penguins-recovery-work
	rm -rf /tmp/verity-uki-work
	rm -rf /tmp/fuse-overlay-work
	rm -rf /tmp/btrfs-rescue
	rm -rf /tmp/buildroot-recovery-work
	rm -rf /tmp/gpt-image-work-*
	rm -rf /tmp/mbr-image-work-*
	rm -f builders/gpt-image/recovery.hdd
	rm -f builders/mbr-image/recovery-mbr.img

# ── CLI install ───────────────────────────────────────────────────────────────

PREFIX  ?= /usr/local
BINDIR  := $(PREFIX)/bin

.PHONY: install-cli uninstall-cli

install-cli: ## Install penguins-recovery CLI to $(PREFIX)/bin
	install -Dm755 bin/penguins-recovery $(DESTDIR)$(BINDIR)/penguins-recovery
	@echo "Installed: $(BINDIR)/penguins-recovery"

uninstall-cli: ## Remove penguins-recovery CLI
	rm -f $(DESTDIR)$(BINDIR)/penguins-recovery
