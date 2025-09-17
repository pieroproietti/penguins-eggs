# How to Install penguins-eggs on openSUSE (Leap)
To easily install penguins-eggs on your openSUSE system and receive automatic updates, you can add our official RPM repository.

The process requires just a few simple terminal commands.

## Step 1: Import the Repository GPG Key
First, we need to import the GPG key that the packages are signed with. This ensures your system that the software you install is authentic and secure.

Run this command to import the key:
```
sudo rpm --import https://pieroproietti.github.io/penguins-eggs-repo/KEY.asc
```

## Step 2: Add the penguins-eggs Repository
Now, we need to tell zypper (the openSUSE package manager) where to find our packages. We will create a new repository configuration file.

Run this command to open a text editor and create the file:
```
sudo nano /etc/zypp/repos.d/penguins-eggs.repo
```
Paste the following text inside the editor:
```
[penguins-eggs]
name=penguins-eggs-repo
baseurl=https://pieroproietti.github.io/penguins-eggs/rpm/opensuse/leap/
enabled=1
gpgcheck=1
gpgkey=https://pieroproietti.github.io/penguins-eggs/KEY.asc
autorefresh=1
type=rpm-md
```
Save the file and close the editor (in nano, press Ctrl+X, then Y, and Enter).

## Step 3: Install penguins-eggs
Your system now knows about our repository. To install the package, refresh the package cache and install penguins-eggs with the following commands:
```
sudo zypper refresh
sudo zypper install penguins-eggs
```
Done! penguins-eggs is now installed on your system. Whenever you perform a system update (sudo zypper up), you will automatically receive the latest version of penguins-eggs.