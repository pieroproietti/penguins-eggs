# CI

I am beginning to understand the logic of your CI.

The scripts `1000*` in the root of the project are called by the actions. The acrions use `uses: actions/setup-node@v2` and, using node18 eggs tarballs is created.

When the tarballs - actually named `penguins-eggs_10.0.60-*-linux-x64.tar.gz` - has been created, it is copied to /`mychroot/ci`.

At this point the container that builds the image is started in accord, and as a paramater receove the command: 
`/ci/10006-archlinux-container-test-install.sh`.

So, we have two level of containers using CI, the base ubuntu-22.04 created from action and using nodejs18, to build tarballs. The second, using the distro we intend to build, receive tarballs from the first - or from local, when I'm using podman - install penguins-eggs and create ISO.

I was a little confused by this mechanism, now it will be better.
