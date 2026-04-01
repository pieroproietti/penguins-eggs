// Generated automatically with "fut". Do not edit.

export class AndroidShared
{
	private constructor()
	{
	}

	public static readonly ABI_ARM64: string = "arm64-v8a";

	public static readonly ABI_ARM32: string = "armeabi-v7a";

	public static readonly ABI_X8664: string = "x86_64";

	public static readonly ABI_X86: string = "x86";

	public static readonly ABI_RISCV64: string = "riscv64";

	public static readonly BOOTLOADER_GRUB: string = "grub";

	public static readonly BOOTLOADER_SYSLINUX: string = "syslinux";

	public static readonly BOOTLOADER_UBOOT: string = "uboot";

	public static readonly BOOTLOADER_OPENSBI: string = "opensbi";

	public static readonly BOOTLOADER_EDK2: string = "edk2";

	public static readonly KERNEL_BZ_IMAGE: string = "bzImage";

	public static readonly KERNEL_IMAGE_GZ: string = "Image.gz";

	public static readonly KERNEL_Z_IMAGE: string = "zImage";

	public static readonly KERNEL_VMLINUX: string = "vmlinux";

	public static readonly KERNEL_VMLINUZ: string = "vmlinuz";

	public static readonly PROP_CPU_ABI: string = "ro.product.cpu.abi";

	public static readonly PROP_CPU_ABILIST: string = "ro.product.cpu.abilist";

	public static readonly PROP_CPU_ABILIST32: string = "ro.product.cpu.abilist32";

	public static readonly PROP_CPU_ABILIST64: string = "ro.product.cpu.abilist64";

	public static readonly PROP_ANDROID_VER: string = "ro.build.version.release";

	public static readonly PROP_SDK_VER: string = "ro.build.version.sdk";

	public static readonly PROP_BUILD_ID: string = "ro.build.id";

	public static readonly PROP_DISPLAY_ID: string = "ro.build.display.id";

	public static readonly PROP_FINGERPRINT: string = "ro.build.fingerprint";

	public static readonly PROP_BUILD_TYPE: string = "ro.build.type";

	public static readonly PROP_SECURITY_PATCH: string = "ro.build.version.security_patch";

	public static readonly PROP_PRODUCT_DEVICE: string = "ro.product.device";

	public static readonly PROP_PRODUCT_BRAND: string = "ro.product.brand";

	public static readonly PROP_PRODUCT_MODEL: string = "ro.product.model";

	public static readonly PROP_BUILD_FLAVOR: string = "ro.build.flavor";

	public static readonly PROP_DYNAMIC_PARTS: string = "ro.boot.dynamic_partitions";

	public static readonly PROP_SLOT_SUFFIX: string = "ro.boot.slot_suffix";

	public static readonly VARIANT_AOSP: string = "aosp";

	public static readonly VARIANT_BLISSOS: string = "blissos";

	public static readonly VARIANT_GRAPHENEOS: string = "grapheneos";

	public static readonly VARIANT_LINEAGEOS: string = "lineageos";

	public static readonly VARIANT_WAYDROID: string = "waydroid";

	public static readonly VARIANT_CUTTLEFISH: string = "cuttlefish";

	public static readonly VARIANT_BASSOS: string = "bassos";

	public static readonly VARIANT_CUSTOM: string = "custom";

	public static readonly SOURCE_LIVE_SYSTEM: string = "live-system";

	public static readonly SOURCE_WAYDROID_CONTAINER: string = "waydroid-container";

	public static readonly SOURCE_BUILD_OUTPUT: string = "build-output";

	public static readonly AVB_SHA256_RSA2048: string = "SHA256_RSA2048";

	public static readonly AVB_SHA256_RSA4096: string = "SHA256_RSA4096";

	public static readonly AVB_SHA256_RSA8192: string = "SHA256_RSA8192";

	public static readonly AVB_SHA512_RSA4096: string = "SHA512_RSA4096";

	public static readonly BOOT_STATE_GREEN: string = "green";

	public static readonly BOOT_STATE_YELLOW: string = "yellow";

	public static readonly BOOT_STATE_ORANGE: string = "orange";

	public static readonly BOOT_STATE_RED: string = "red";

	public static readonly BOOT_STATE_UNKNOWN: string = "unknown";

	public static readonly MANIFEST_VERSION: string = "manifestVersion";

	public static readonly MANIFEST_SCHEMA_VER: string = "1";

	public static readonly MANIFEST_ARCH: string = "arch";

	public static readonly MANIFEST_VARIANT: string = "variant";

	public static readonly MANIFEST_ANDROID_VER: string = "androidVersion";

	public static readonly MANIFEST_SDK_LEVEL: string = "sdkLevel";

	public static readonly MANIFEST_BUILD_ID: string = "buildId";

	public static readonly MANIFEST_SYSTEM_IMG: string = "systemImg";

	public static readonly MANIFEST_BOOT_IMG: string = "bootImg";

	public static readonly MANIFEST_VENDOR_IMG: string = "vendorImg";

	public static readonly MANIFEST_AVB_SIGNED: string = "avbSigned";

	public static readonly MANIFEST_AVB_ALGO: string = "avbAlgorithm";

	public static readonly MANIFEST_SOURCE_TYPE: string = "sourceType";

	public static readonly MANIFEST_BUILT_AT: string = "builtAt";

	public static readonly MANIFEST_EGGS_VERSION: string = "eggsVersion";

	/**
	 * Returns the Linux kernel arch string for a given Android ABI.
	 * Returns "unknown" for unrecognised ABIs.
	 */
	public static kernelArchForAbi(abi: string): string
	{
		if (abi == "arm64-v8a")
			return "aarch64";
		if (abi == "armeabi-v7a")
			return "armv7l";
		if (abi == "x86_64")
			return "x86_64";
		if (abi == "x86")
			return "i686";
		if (abi == "riscv64")
			return "riscv64";
		return "unknown";
	}

	/**
	 * Returns the recommended bootloader for a given Android ABI.
	 */
	public static bootloaderForAbi(abi: string): string
	{
		if (abi == "x86_64")
			return "grub";
		if (abi == "x86")
			return "syslinux";
		if (abi == "arm64-v8a")
			return "uboot";
		if (abi == "armeabi-v7a")
			return "uboot";
		if (abi == "riscv64")
			return "opensbi";
		return "grub";
	}

	/**
	 * Returns the expected kernel image filename for a given Android ABI.
	 */
	public static kernelImageName(abi: string): string
	{
		if (abi == "x86_64")
			return "bzImage";
		if (abi == "x86")
			return "bzImage";
		if (abi == "arm64-v8a")
			return "Image.gz";
		if (abi == "armeabi-v7a")
			return "zImage";
		if (abi == "riscv64")
			return "vmlinux";
		return "vmlinuz";
	}

	/**
	 * Returns true if the ABI supports ISO output.
	 * ARM architectures use raw disk images instead.
	 */
	public static archSupportsIso(abi: string): boolean
	{
		if (abi == "x86_64")
			return true;
		if (abi == "x86")
			return true;
		if (abi == "riscv64")
			return true;
		return false;
	}

	/**
	 * Returns true if the ABI supports fastboot flashing.
	 */
	public static archSupportsFastboot(abi: string): boolean
	{
		if (abi == "riscv64")
			return false;
		return true;
	}

	/**
	 * Returns true if the ABI is 64-bit.
	 */
	public static is64Bit(abi: string): boolean
	{
		if (abi == "arm64-v8a")
			return true;
		if (abi == "x86_64")
			return true;
		if (abi == "riscv64")
			return true;
		return false;
	}

	/**
	 * Returns the secondary (32-bit) ABI for a 64-bit primary ABI,
	 * or an empty string if there is no secondary ABI.
	 */
	public static secondaryAbi(primaryAbi: string): string
	{
		if (primaryAbi == "arm64-v8a")
			return "armeabi-v7a";
		if (primaryAbi == "x86_64")
			return "x86";
		return "";
	}

	/**
	 * Returns true if the AVB algorithm string is valid.
	 */
	public static isValidAvbAlgorithm(algo: string): boolean
	{
		if (algo == "SHA256_RSA2048")
			return true;
		if (algo == "SHA256_RSA4096")
			return true;
		if (algo == "SHA256_RSA8192")
			return true;
		if (algo == "SHA512_RSA4096")
			return true;
		return false;
	}

	/**
	 * Returns true if the variant string is a known Android variant.
	 */
	public static isKnownVariant(variant: string): boolean
	{
		if (variant == "aosp")
			return true;
		if (variant == "blissos")
			return true;
		if (variant == "grapheneos")
			return true;
		if (variant == "lineageos")
			return true;
		if (variant == "waydroid")
			return true;
		if (variant == "cuttlefish")
			return true;
		if (variant == "bassos")
			return true;
		if (variant == "custom")
			return true;
		return false;
	}

	/**
	 * Returns true if the manifest version is supported by this library.
	 */
	public static isManifestVersionSupported(version: string): boolean
	{
		return version == "1";
	}
}
