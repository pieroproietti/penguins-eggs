#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL
# SPDX-FileCopyrightText: 2020 Harald Sitter <sitter@kde.org>

# Carry nomodeset into chroot

set -ex

if ! grep -q nomodeset /proc/cmdline; then
  exit 0
fi

echo "Forwarding nomodeset to installed system"

cat > /etc/default/grub.d/neon-installation-nomodeset.cfg << 'EOF'
GRUB_CMDLINE_LINUX_DEFAULT="${GRUB_CMDLINE_LINUX_DEFAULT} nomodeset"
EOF

update-grub
