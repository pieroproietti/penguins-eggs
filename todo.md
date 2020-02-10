# Ubuntu/Debian packages
Build a deb package with oclif-dev pack:deb. Set the MYCLI_DEB_KEY to a gpg key id to create the gpg files. This will include all the files needed for an apt repository in ./dist/deb. They can be published to S3 with oclif-dev publish:deb.

Once it's published to S3, users can install with the following:

$ wget -qO- https://mys3bucket.s3.amazonaws.com/apt/release.key | apt-key add - # you will need to upload this file manually
$ sudo echo "deb https://mys3bucket.s3.amazonaws.com/apt ./" > /etc/apt/sources.list.d/mycli.list
$ sudo apt update
$ sudo apt install -y mycli
This can be placed in a script for users to install with curl https://pathto/myscript | sh.

These will not autoupdate as Ubuntu already has a reliable way for users to update their package.

# Snapcraft
Snap is a great way to distribute Linux CLIs and comes built into Ubuntu 16+. The Heroku CLI's snapcraft.yml file can be easily modified to work with any oclif CLI.