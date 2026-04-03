# Generated automatically with "fut". Do not edit.

class AndroidShared:

	ABI_ARM64 = "arm64-v8a"

	ABI_ARM32 = "armeabi-v7a"

	ABI_X8664 = "x86_64"

	ABI_X86 = "x86"

	ABI_RISCV64 = "riscv64"

	BOOTLOADER_GRUB = "grub"

	BOOTLOADER_SYSLINUX = "syslinux"

	BOOTLOADER_UBOOT = "uboot"

	BOOTLOADER_OPENSBI = "opensbi"

	BOOTLOADER_EDK2 = "edk2"

	KERNEL_BZ_IMAGE = "bzImage"

	KERNEL_IMAGE_GZ = "Image.gz"

	KERNEL_Z_IMAGE = "zImage"

	KERNEL_VMLINUX = "vmlinux"

	KERNEL_VMLINUZ = "vmlinuz"

	PROP_CPU_ABI = "ro.product.cpu.abi"

	PROP_CPU_ABILIST = "ro.product.cpu.abilist"

	PROP_CPU_ABILIST32 = "ro.product.cpu.abilist32"

	PROP_CPU_ABILIST64 = "ro.product.cpu.abilist64"

	PROP_ANDROID_VER = "ro.build.version.release"

	PROP_SDK_VER = "ro.build.version.sdk"

	PROP_BUILD_ID = "ro.build.id"

	PROP_DISPLAY_ID = "ro.build.display.id"

	PROP_FINGERPRINT = "ro.build.fingerprint"

	PROP_BUILD_TYPE = "ro.build.type"

	PROP_SECURITY_PATCH = "ro.build.version.security_patch"

	PROP_PRODUCT_DEVICE = "ro.product.device"

	PROP_PRODUCT_BRAND = "ro.product.brand"

	PROP_PRODUCT_MODEL = "ro.product.model"

	PROP_BUILD_FLAVOR = "ro.build.flavor"

	PROP_DYNAMIC_PARTS = "ro.boot.dynamic_partitions"

	PROP_SLOT_SUFFIX = "ro.boot.slot_suffix"

	VARIANT_AOSP = "aosp"

	VARIANT_BLISSOS = "blissos"

	VARIANT_GRAPHENEOS = "grapheneos"

	VARIANT_LINEAGEOS = "lineageos"

	VARIANT_WAYDROID = "waydroid"

	VARIANT_CUTTLEFISH = "cuttlefish"

	VARIANT_BASSOS = "bassos"

	VARIANT_CUSTOM = "custom"

	SOURCE_LIVE_SYSTEM = "live-system"

	SOURCE_WAYDROID_CONTAINER = "waydroid-container"

	SOURCE_BUILD_OUTPUT = "build-output"

	AVB_SHA256_RSA2048 = "SHA256_RSA2048"

	AVB_SHA256_RSA4096 = "SHA256_RSA4096"

	AVB_SHA256_RSA8192 = "SHA256_RSA8192"

	AVB_SHA512_RSA4096 = "SHA512_RSA4096"

	BOOT_STATE_GREEN = "green"

	BOOT_STATE_YELLOW = "yellow"

	BOOT_STATE_ORANGE = "orange"

	BOOT_STATE_RED = "red"

	BOOT_STATE_UNKNOWN = "unknown"

	MANIFEST_VERSION = "manifestVersion"

	MANIFEST_SCHEMA_VER = "1"

	MANIFEST_ARCH = "arch"

	MANIFEST_VARIANT = "variant"

	MANIFEST_ANDROID_VER = "androidVersion"

	MANIFEST_SDK_LEVEL = "sdkLevel"

	MANIFEST_BUILD_ID = "buildId"

	MANIFEST_SYSTEM_IMG = "systemImg"

	MANIFEST_BOOT_IMG = "bootImg"

	MANIFEST_VENDOR_IMG = "vendorImg"

	MANIFEST_AVB_SIGNED = "avbSigned"

	MANIFEST_AVB_ALGO = "avbAlgorithm"

	MANIFEST_SOURCE_TYPE = "sourceType"

	MANIFEST_BUILT_AT = "builtAt"

	MANIFEST_EGGS_VERSION = "eggsVersion"

	@staticmethod
	def kernel_arch_for_abi(abi: str) -> str:
		"""Returns the Linux kernel arch string for a given Android ABI.

		Returns "unknown" for unrecognised ABIs."""
		if abi == "arm64-v8a":
			return "aarch64"
		if abi == "armeabi-v7a":
			return "armv7l"
		if abi == "x86_64":
			return "x86_64"
		if abi == "x86":
			return "i686"
		if abi == "riscv64":
			return "riscv64"
		return "unknown"

	@staticmethod
	def bootloader_for_abi(abi: str) -> str:
		"""Returns the recommended bootloader for a given Android ABI."""
		if abi == "x86_64":
			return "grub"
		if abi == "x86":
			return "syslinux"
		if abi == "arm64-v8a":
			return "uboot"
		if abi == "armeabi-v7a":
			return "uboot"
		if abi == "riscv64":
			return "opensbi"
		return "grub"

	@staticmethod
	def kernel_image_name(abi: str) -> str:
		"""Returns the expected kernel image filename for a given Android ABI."""
		if abi == "x86_64":
			return "bzImage"
		if abi == "x86":
			return "bzImage"
		if abi == "arm64-v8a":
			return "Image.gz"
		if abi == "armeabi-v7a":
			return "zImage"
		if abi == "riscv64":
			return "vmlinux"
		return "vmlinuz"

	@staticmethod
	def arch_supports_iso(abi: str) -> bool:
		"""Returns true if the ABI supports ISO output.

		ARM architectures use raw disk images instead."""
		if abi == "x86_64":
			return True
		if abi == "x86":
			return True
		if abi == "riscv64":
			return True
		return False

	@staticmethod
	def arch_supports_fastboot(abi: str) -> bool:
		"""Returns true if the ABI supports fastboot flashing."""
		if abi == "riscv64":
			return False
		return True

	@staticmethod
	def is64_bit(abi: str) -> bool:
		"""Returns true if the ABI is 64-bit."""
		if abi == "arm64-v8a":
			return True
		if abi == "x86_64":
			return True
		if abi == "riscv64":
			return True
		return False

	@staticmethod
	def secondary_abi(primary_abi: str) -> str:
		"""Returns the secondary (32-bit) ABI for a 64-bit primary ABI,
		or an empty string if there is no secondary ABI."""
		if primary_abi == "arm64-v8a":
			return "armeabi-v7a"
		if primary_abi == "x86_64":
			return "x86"
		return ""

	@staticmethod
	def is_valid_avb_algorithm(algo: str) -> bool:
		"""Returns true if the AVB algorithm string is valid."""
		if algo == "SHA256_RSA2048":
			return True
		if algo == "SHA256_RSA4096":
			return True
		if algo == "SHA256_RSA8192":
			return True
		if algo == "SHA512_RSA4096":
			return True
		return False

	@staticmethod
	def is_known_variant(variant: str) -> bool:
		"""Returns true if the variant string is a known Android variant."""
		if variant == "aosp":
			return True
		if variant == "blissos":
			return True
		if variant == "grapheneos":
			return True
		if variant == "lineageos":
			return True
		if variant == "waydroid":
			return True
		if variant == "cuttlefish":
			return True
		if variant == "bassos":
			return True
		if variant == "custom":
			return True
		return False

	@staticmethod
	def is_manifest_version_supported(version: str) -> bool:
		"""Returns true if the manifest version is supported by this library."""
		return version == "1"
