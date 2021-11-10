# Waydroid

I'm just playng with waydroid, follow suggestions from @electrikjesus... 
for now I was able to get waydroid on bullseys and bookstorm.

## Installing rerequisites
```sudo apt install curl lxc```

I get wayland in two ways: installing gnome-core or installing weston.

```sudo apt install gnome-come```

```sudo apt install weston```

## Install waydroid
Follow [installing waydroid](https://docs.waydro.id/usage/install-on-desktops)

## rendering sofware KVM
When finished, we need to run ```waydroid init``` to get the datas for the container, after that we can
edit the file ```waydroid_base.prop``` to our needs.

```
sudo nano /var/lib/waydroid/waydroid_base.prop
```

And change both these to what is shown below: 
~~~
ro.hardware.gralloc=default
ro.hardware.egl=swiftshader
~~~

after restart the service

```
sudo systemctl stop waydroid-container
sudo systemctl start waydroid-container
```

run weston and from the terminal run 
```waydroid show-full-ui```

