# How to Install penguins-eggs on openSUSE (Leap)
To easily install penguins-eggs on your openSUSE system and receive automatic updates, you can add our official RPM repository.

The process requires just a few simple terminal commands.

## Step 1: Import the Repository GPG Key
First, we need to import the GPG key that the packages are signed with. This ensures your system that the software you install is authentic and secure.

Run this commands to add `penguins-egge-repo` and install `penguins-eggs`:

```
sudo zypper addrepo --refresh 'https://penguins-eggs.net/repos/rpm/opensuse/leap/' penguins-eggs-repo
sudo zypper refresh
sudo zypper install penguins-eggs
```

```
Done! penguins-eggs is now installed on your system. Whenever you perform a system update (sudo zypper up), you will automatically receive the latest version of penguins-eggs.