# **CI Guidelines and Workflow Explanation**  

## **Core Principles of CI**  

1. **Minimal CI Test Environment**  
   - Install only the minimal dependencies required for CI, avoiding unnecessary packages.  
   - Build only the minimal ISO without unnecessary installations.  
   - CI is designed to **test issues in `penguins-eggs`**, not for building or publishing ISO images.  
   - Increase the variety of tests to detect potential bugs in `penguins-eggs`.  

2. **CI Directory Structure and Usage**  
   - **Keep CI files strictly for CI tasks**; do not mix them with local development files.  
   - If testing locally, place files in `pods`, **not** in `mychroot/ci/`.  
   - **`mychroot/ci/` is exclusively for CI purposes—no non-CI files should be placed there.**  
   - **For local testing, mount `ci` and `local-dev` instead of modifying CI files directly.**  

Example: Running a local test with Podman by mounting `ci` and `pods`:  
```sh
podman run \
    --hostname minimal \
    --privileged \
    --cap-add=CAP_SYS_ADMIN \
    --ulimit nofile=32000:32000 \
    --pull=always \
    -v $PWD/mychroot/ci:/ci \
    -v $PWD/pods:/pods \
    -v /dev:/dev ubuntu:24.04 \
    bash
```
Inside the container, verify the mounts:  
```sh
ls -al /ci/
ls -al /pods/
```

---

## **Warnings When Modifying CI Files**  

1. **Do not modify CI files unless absolutely necessary.**  
2. **Do not disable any CI tests**—all tests must remain active.  
3. **Do not change the current ISO build workflow.**  
4. **CI test scripts follow a fixed numbering system.** To add new tests, use a new range (e.g., `30000-40000`, `50000`), and do not modify existing numbered files.  
5. **If using `penguins-wardrobe` for builds, add new CI tests instead of modifying existing files or workflows.**  
6. **All CI file modifications must be submitted in a new Pull Request and reviewed by @gnuhub—do not merge directly.**  
7. **For experimental changes, create a new branch instead of modifying `master`.**  

---

## **How the CI Workflow Functions**  

### **1. CI Workflow Overview**  

- CI is triggered by scripts numbered `1000*` located in the project root.  
- Actions use `actions/setup-node@v2` with `Node.js 18` to build tarballs.  
- The generated `penguins-eggs` tarball is named:  
  ```
  penguins-eggs_10.0.60-*-linux-x64.tar.gz
  ```
- The tarball is then copied to `/mychroot/ci/`.  
- A second container starts the ISO build process, receiving the tarballs and running:  
  ```
  /ci/10006-archlinux-container-test-install.sh
  ```
- This results in a two-layered container CI process:  
  1. The **ci host server** (Ubuntu 24.04) runs on GitHub Actions, builds the `Node.js` tarballs.  
  2. The **target container** (specific distro being tested) receives the tarballs, installs `penguins-eggs`, and creates the ISO.  

Example of running the second-level container manually:  
```sh
podman run \
    --hostname minimal \
    --privileged \
    --cap-add=CAP_SYS_ADMIN \
    --ulimit nofile=32000:32000 \
    --pull=always \
    -v $PWD/mychroot/ci:/ci \
    -v /dev:/dev ubuntu:24.04 \
    /ci/10002-ubuntu2404-container-test-install.sh
```

Now that this process is clear, it should be easier to work with.