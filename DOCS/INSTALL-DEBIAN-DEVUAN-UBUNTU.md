# How to Install penguins-eggs on Debian, Ubuntu, and derivatives
To easily install penguins-eggs on your system and receive automatic updates, you can add our official APT repository.

This process, based on modern security practices, requires just a few simple terminal commands.

## Step 1: Add the Repository GPG Key
First, we need to teach your system to trust our repository. We do this by importing the public GPG key that the packages are signed with. This ensures that the software you install is authentic and has not been modified.

Run this command to download and securely install the key:
```
curl -fsSL https://https://penguins-eggs.net/repos/KEY.asc | sudo gpg --dearmor -o /usr/share/keyrings/penguins-eggs-repos.gpg
```

## Step 2: Add the Repository to the Sources List
Now, we need to tell apt (the package manager) where to find our packages. We will create a new configuration file that points to our repository.
```
echo "deb [signed-by=/usr/share/keyrings/penguins-eggs-repos.gpg] https://penguins-eggs.net/repos/deb stable main" | sudo tee /etc/apt/sources.list.d/penguins-eggs-repos.list > /dev/null
```

## Step 3: Install penguins-eggs
Your system now knows about our repository and can verify its authenticity. To install the package, update the package cache and install penguins-eggs with the following commands:
```
sudo apt-get update
sudo apt-get install penguins-eggs
```
Done! penguins-eggs is now installed on your system. Whenever you perform a system update (sudo apt-get upgrade), you will automatically receive the latest version of penguins-eggs.