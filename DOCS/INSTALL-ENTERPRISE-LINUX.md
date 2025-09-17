# How to Install penguins-eggs on Enterprise Linux (and derivatives)
To install penguins-eggs on your Enterprise Linux system—such as AlmaLinux, Rocky Linux, or any other dnf/yum-based distribution—you can add our official RPM repository. This will ensure a simple installation and automatic updates.

The process requires just a few terminal commands.

## Step 1: Import the Repository GPG Key
First, we need to import the GPG key that the packages are signed with. This assures your system that the software you install is authentic and has not been modified.

Run this command to import the key:
```
sudo rpm --import https://pieroproietti.github.io/penguins-eggs-repo/KEY.asc
```
## Step 2: Add the penguins-eggs Repository
Now, we need to tell dnf where to find our packages. We will create a new repository configuration file.

Run this command to create and open the file with the nano editor:
```
sudo nano /etc/yum.repos.d/penguins-eggs.repo
```

Paste the following text inside the editor:
```
[penguins-eggs]
name=penguins-eggs-repo
baseurl=https://pieroproietti.github.io/penguins-eggs-repo/rpm/el/9
enabled=1
gpgcheck=1
gpgkey=https://pieroproietti.github.io/penguins-eggs-repo/KEY.asc
```
Note: This example uses the repository for Enterprise Linux 9. If you are using a different version, like EL8, change the path accordingly (e.g., el/8).

Save the file and close the editor (in nano, press Ctrl+X, then Y, and Enter).

## Step 3: Install penguins-eggs
Your system now knows about our repository. To install the package, update the package cache and install penguins-eggs with the following commands:
```
sudo dnf makecache
sudo dnf install penguins-eggs
```

Done! penguins-eggs is now installed on your system. Whenever you perform a system update (sudo dnf upgrade), you will automatically receive the latest version of penguins-eggs.