# Update new pkgbuild

## Create new tag

```git tag v9.2.3```

## Push tags

```git push --tags```

## Download release

```wget https://github.com/pieroproietti/penguins-eggs/archive/v9.2.3.tar.gz```

## Calculate sha256sum
sha256sum v9.2.3.tar.gz

## replace in pkgbuild
* pkgver=9.2.3
* sha256sums=('00a96b59db0a56b931231394a909f037e83f76837da85d639ff85df9525bd5ff')
