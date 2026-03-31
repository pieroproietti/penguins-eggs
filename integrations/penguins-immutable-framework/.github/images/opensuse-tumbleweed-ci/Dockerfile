# CI bootstrap image for openSUSE Tumbleweed.
#
# opensuse/tumbleweed:latest ships /bin/bash but no /bin/sh symlink, and
# lacks tar, git, and gzip — all required by actions/checkout before any
# run: step can execute. This image adds those tools and creates the
# /bin/sh → /bin/bash symlink so the GitHub Actions runner can launch steps.
FROM opensuse/tumbleweed:latest

RUN zypper --non-interactive refresh \
 && zypper --non-interactive install -y \
      bash \
      tar \
      gzip \
      git \
      ca-certificates \
 && ln -sf /bin/bash /bin/sh \
 && zypper clean --all

# Verify the symlink and tools are present.
RUN sh --version && tar --version && git --version
