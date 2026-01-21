# The Nest

The **nest** is the working directory for `penguins-eggs`, typically located at `/home/eggs`.
It contains all the temporary files, mount points, and structures required to build the live ISO.

## Structure

The directory structure has been evolved to be cleaner and more explicit, removing the reliance on top-level symlinks for critical paths.

### Visible Directories

*   **`${nest}/bin`**: Contains helper scripts and executables (like `mksquashfs` wrappers) used during the build process.
*   **`${nest}/liveroot`**: This is the read-write view of the system being built. It is the merged mount point of the OverlayFS (combining the read-only host system and the read-write upper layer). Formerly known as `livefs`.
*   **`${nest}/mnt`**: A dedicated directory for mount points.
    *   **`${nest}/mnt/iso`**: The staging area where the final ISO image structure is assembled. This contains the `live` directory (with `filesystem.squashfs`, kernel, initrd) and bootloaders (`boot`, `EFI`).
*   **`${nest}/tmp`**: Directory for temporary files.
    *   **`${nest}/tmp/efi`**: Work directory for preparing EFI bootloader partitions.

### Hidden Directories

*   **`${nest}/.overlay`**: Contains the internal components of the OverlayFS used to create `liveroot`.
    *   `${nest}/.overlay/lowerdir`: The read-only base layer (bind mount of the host system).
    *   `${nest}/.overlay/upperdir`: The read-write layer where changes made during the session are stored.
    *   `${nest}/.overlay/workdir`: The work directory required by OverlayFS for atomicity.

## Legacy Comparison

*   **Original**: Used `/home/eggs` with flat structure (`iso`, `ovarium` etc.)
*   **Intermediate**: Used `.mnt` hidden directory with symlinks (`livefs`, `iso` -> `.mnt/...`).
*   **Current**: Uses explicit directories (`liveroot`, `mnt/iso`, `bin`) to improve clarity and avoid symlink dereferencing issues with some tools.
