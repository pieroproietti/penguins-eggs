# CI


## do one thing and do it batter (minimal tests)


1. ci minimal tests [don't add packages not needed for ci]
1. only build the minial iso,[don't install packages not needed for ci]




only for ci don't make the ci and local-dev together

if you want use it in local ,put files in pod->local-dev not in mychroot/ci/

remove files from ci  move the local-dev files to local-dev
mychroot/ci is only for ci,don't put other files in ci

if you want to test on local just mount ci and local-dev like this,dont put dev file in ci

```

```
podman run \
    --hostname minimal \
     --privileged \
     --cap-add=CAP_SYS_ADMIN \
     --ulimit nofile=32000:32000 \
     --pull=always \
     -v $PWD/mychroot/ci:/ci \
     -v $PWD/local-dev:/local-dev \
     -v /dev:/dev ubuntu:24.04 \
     bash

### in container you can see them

# ls -al /ci/
# ls -al /local-dev/

```



## WARNING WHEN CHANGING CI FILES

1. don't change ci files if you are not sure
2. don't change ci files if it is not necessary
3. don't disable any one of ci tests
4. don't change the current workflow of build iso
5. don't change the number of ci files, just add new files with a new number range such as 30000- 40000 50000
6. if you want to use penguins-wardroe to build,add new ci tests and don't change the current ci files and workflows
7. if you want to change this file, add a new pull request and @gnuhub don't merge it
8. if you just test changes ,don't change it on master,checkout -b a new branch


I am beginning to understand the logic of your CI.

The scripts `1000*` in the root of the project are called by the actions. The acrions use `uses: actions/setup-node@v2` and, using node18 eggs tarballs is created.

When the tarballs - actually named `penguins-eggs_10.0.60-*-linux-x64.tar.gz` - has been created, it is copied to /`mychroot/ci`.

At this point the container that builds the image is started in accord, and as a paramater receove the command: 
`/ci/10006-archlinux-container-test-install.sh`.

So, we have two level of containers using CI, the base ubuntu-22.04 created from action and using nodejs18, to build tarballs. The second, using the distro we intend to build, receive tarballs from the first - or from local, when I'm using podman - install penguins-eggs and create ISO.

```
podman run \
    --hostname minimal \
     --privileged \
     --cap-add=CAP_SYS_ADMIN \
     --ulimit nofile=32000:32000 \
     --pull=always \
     -v $PWD/mychroot/ci:/ci \
     -v /dev:/dev ubuntu:24.04 \
     /ci/10002-ubuntu2404-container-test-install.sh
```

I was a little confused by this mechanism, now it will be better.


