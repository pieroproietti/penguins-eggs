# CI Architecture in oa-tools (Smoketest vs CI Theater)

> "The Master said: 'To know what you know and what you do not know, that is true knowledge.' Do not force the machine to simulate what the heavens forbid." — *The Way of the Code*

This document outlines the philosophy and technical considerations guiding Continuous Integration (CI) within the `oa-tools` monorepo (`oa` in C, `coa` in Go).

## The Context: System Software vs Web Applications

The vast majority of CI/CD platforms (such as GitHub Actions, GitLab CI, etc.) are designed for web applications or generic user-space software. In those environments, tests orchestrate isolated, hardened Docker containers devoid of special privileges.

`oa-tools` is a **low-level remastering framework**. To fulfill its duty, it must:
1. Manipulate file systems directly.
2. Execute complex bind mounts (`/proc`, `/sys`, `/dev`) inside a `liveroot`.
3. Invoke `chroot` operations.
4. Interact directly with the host's Linux Kernel primitives.

## The Failure of "CI Theater"

Attempting to emulate the entire remastering flight plan (up to SquashFS creation and final ISO generation via `xorriso`) within standard GitHub Actions containers encounters insurmountable security restrictions at the host kernel level of the runners.

Forcing the pipeline into these blind environments leads to:
* Systematic failures of the internal chroot shell (`oa_shell` exit code 1) due to partial or dummy mounts.
* The introduction of a massive amount of "fake" conditional logic inside the plan YAMLs (e.g., `{{ if .IsGitHubAction }}`) just to satisfy the GitHub validator.

Wasting time writing artificial code to bypass CI restrictions adds zero value to the project. **The quality of system software is tested on the road, not in a test tube.**

## The Strategy: The Radical Smoketest

To overcome this, the CI on GitHub Actions has been stripped down to its core, implementing a pure **Smoketest** focused on code structure and syntax health rather than standard deployment simulation.

The workflow on `ubuntu-latest` executes everything:
1. **C Compilation (`oa`):** Verifies that the GCC toolchain compiles the core without syntax or linking errors.
2. **Go Compilation (`coa`):** Verifies that the Go compiler resolves dependencies and handles types correctly.
3. **Complete Remastering Flow:** Inside the execution plan, we applied a surgical bypass:

```go
if isGitHubAction {
	excludes = append(excludes,
		"home/runner/work",
		"usr",
		"var",
	)
}
```

By excluding the massive weight of `usr` and `var` directories without altering the workflow logic, the pipeline executes the *entire* chain—including `mksquashfs` and `xorriso`—producing a non-functional but structurally valid ISO image in less than two minutes. This proves that the codebase is structurally sound, free of major regressions, and that the internal `oa_umount` module successfully cleans up all 12 system mounts.

## The True Testing Ground: Vagrant and Real Virtualization

The actual end-to-end validation of the remastering infrastructure is delegated to full virtualization environments under the complete control of the developer:

* **Local Development VMs (Debian/Ubuntu):** Where the kernel is real and root privileges are effective.
* **Vagrant:** The ideal target for automated full-build testing. Inside a Vagrant box, the operating system runs on a proper hypervisor (VirtualBox/QEMU) with a native kernel, allowing `oa_mount_logic` and `oa_shell` in a chroot environment to operate exactly as they would on physical hardware.

In these native environments, the framework activates biological sensors (e.g., detecting specific paths or users) to calibrate the behavior of the flight plan (such as favoring fast SquashFS compression during development).

---
*"Nature does not hurry, yet everything is accomplished." From a couch in Rome, while Sinner dismantled Ruud.*