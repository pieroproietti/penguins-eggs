ARCH=$(uname -m)
if [[ "$ARCH" == x86_64* ]]; then
  a="amd64"
elif [[ "$ARCH" == i*86 ]]; then
  a=""
elif  [[ "$ARCH" == arm* ]]; then
  a="arm64"
fi

echo   $a
