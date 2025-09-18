# How to use the penguins-eggs Alpine Linux Repository
This repository provides pre-compiled .apk packages for penguins-eggs on Alpine Linux. Follow these simple steps to add the repository to your system and install the package.

Step 1: Add the Public Signing Key
First, you need to add the repository's public key to your system's trusted keys. This allows apk to verify the authenticity of the packages.

Open your terminal and run the following commands:

# Download the public key
```
wget https://pieroproietti.github.io/penguins-eggs-repo/alpine/piero.proietti@gmail.com-68452915.rsa.pub
```
# Move the key to the trusted keys directory
```
sudo mv piero.proietti@gmail.com-68452915.rsa.pub /etc/apk/keys/
```
## Step 2: Add the Repository to Your System
Next, add the penguins-eggs repository to your list of package sources.

Edit the `/etc/apk/repositories` file with your favorite text editor (e.g., vi, nano):
```
sudo nano /etc/apk/repositories
```

Add the following line to the end of the file:
```
https://pieroproietti.github.io/penguins-eggs-repo/alpine
```
Save the file and exit the editor.

## Step 3: Install penguins-eggs
Finally, update your package list and install penguins-eggs:

# Update the package index
```
sudo apk update
```
# Install penguins-eggs
```
sudo apk add penguins-eggs
```
That's it! penguins-eggs is now installed and will be kept up to date along with your other system packages.