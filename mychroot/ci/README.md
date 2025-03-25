# CI

I am beginning to understand the logic of your IC.

The files in the root of the project are called by the actions, 
these use: `uses: actions/setup-node@v2` and, via node18 you build the eggs tarballs

When the tarballs, named `penguins-eggs_10.0.60-*-linux-x64.tar.gz` has been created, it is uploaded to /myroot/ci.

At this point the container that builds the image is started and, as a paramatro the command is passed: 
`/ci/10006-archlinux-container-test-install.sh`.

I was a little confused by this mechanism, now it will be better.
