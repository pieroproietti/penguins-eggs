# CI bootstrap image for Void Linux.
#
# voidlinux/voidlinux:latest ships bash but lacks git, tar, gzip, and
# ca-certificates — all required by actions/checkout and actions/setup-go
# before any run: step can execute. This image adds those tools so the
# GitHub Actions runner can launch steps normally.
#
# Void uses xbps; there is no /bin/sh by default in the slim image so we
# create the symlink explicitly.
FROM voidlinux/voidlinux:latest

RUN xbps-install -Syu xbps \
 && xbps-install -Sy \
      bash \
      tar \
      gzip \
      git \
      ca-certificates \
 && ln -sf /bin/bash /bin/sh \
 && xbps-remove -Oo

# Verify the symlink and tools are present.
RUN sh --version && tar --version && git --version
