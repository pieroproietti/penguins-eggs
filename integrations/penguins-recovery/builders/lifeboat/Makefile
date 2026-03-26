.DEFAULT_GOAL := build

BUILDER_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

.PHONY: fetch
fetch: ## Download Alpine minirootfs and kernel source
	$(BUILDER_DIR)/01_get.sh

.PHONY: install
install: fetch ## Install packages into rootfs via chroot
	$(BUILDER_DIR)/02_chrootandinstall.sh

.PHONY: configure
configure: install ## Configure Alpine rootfs and kernel
	$(BUILDER_DIR)/03_alpine_config.sh
	$(BUILDER_DIR)/04_kernel_config.sh

.PHONY: build
build: configure ## Build LifeboatLinux.efi (full clean build)
	$(BUILDER_DIR)/05_build.sh

.PHONY: menuconfig
menuconfig: ## Open kernel nconfig (run after fetch)
	cd $(BUILDER_DIR)/build/linux && make nconfig

.PHONY: clean
clean: ## Remove all build artifacts
	rm -rf $(BUILDER_DIR)/build/alpine-minirootfs*
	rm -rf $(BUILDER_DIR)/build/linux*
	rm -f  $(BUILDER_DIR)/build/config.initramfs_root
	rm -f  $(BUILDER_DIR)/dist/LifeboatLinux.efi
