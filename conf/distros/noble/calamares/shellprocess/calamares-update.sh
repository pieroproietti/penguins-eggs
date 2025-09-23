#!/bin/sh
# SPDX-FileCopyrightText: 2019 Harald Sitter <sitter@kde.org>
# SPDX-License-Identifier: GPL-3.0-only OR LicenseRef-KDE-Accepted-GPL

set -ex

sudo apt update
sudo apt install calamares calamares-settings -y
sudo -k
