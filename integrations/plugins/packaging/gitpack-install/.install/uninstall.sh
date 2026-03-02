#!/bin/sh
# gitpack uninstall script for penguins-eggs
# Enables: gitpack uninstall pieroproietti/penguins-eggs

set -eu

echo "Uninstalling penguins-eggs..."

if command -v dpkg >/dev/null 2>&1 && dpkg -l penguins-eggs >/dev/null 2>&1; then
  apt-get remove -y penguins-eggs
elif command -v rpm >/dev/null 2>&1 && rpm -q penguins-eggs >/dev/null 2>&1; then
  rpm -e penguins-eggs
elif command -v npm >/dev/null 2>&1; then
  npm uninstall -g penguins-eggs
fi

# Clean up config if user confirms
if [ -d /etc/penguins-eggs.d ]; then
  echo "Configuration directory /etc/penguins-eggs.d remains. Remove manually if desired."
fi

echo "penguins-eggs uninstalled"
