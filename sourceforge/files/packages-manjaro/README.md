# panguins-eggs manjaro

First, we need to install hooks from manjaro-tools:

Copy and paste follow instructions

```
git clone https://gitlab.manjaro.org/tools/development-tools/manjaro-tools
sudo cp manjaro-tools/initcpio/hooks/ /usr/lib/initcpio/ -R
sudo cp manjaro-tools/initcpio/install/ /usr/lib/initcpio/ -R
sudo cp manjaro-tools/initcpio/script/miso_shutdown /etc/initcpio/
```

Then, to build and install penguins-eggs:
Copy and paste follow instructions
```
mkdir try-penguins-eggs
cd try-penguins-eggs
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs-manjaro/main/PKGBUILD
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs-manjaro/main/penguins-eggs.install
makepkg -srcCi
```

panguins-eggs on [manjaro-forum](https://forum.manjaro.org/t/penguins-eggs-help-needed-for-manjaro-compatibility/96799)
