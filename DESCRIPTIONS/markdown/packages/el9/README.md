# el9

```
sudo dnf install \
    gcc-c++ \
    make \
    rpm-build \
    rpmdevtools
```

# SELINUX

Edit /etc/selinux/config and put:
```
SELINUX=permissive
```

### epel, nodesource
We need to enable epel and get nodejs>18.

```
./install-prerequisites.sh
```
