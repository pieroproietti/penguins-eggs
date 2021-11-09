# Waydroid

I'm just playng with waydroid, follow suggestions from 
@electrikjesus... for now I was able to get waydroid on 
bookstorm.



## rendering sofware KVM
edit /var/lib/waydroid/waydroid_base.prop

Change both these to what is shown below: 
~~~
ro.hardware.gralloc=default
ro.hardware.egl=swiftshader
~~~

after restart the service
```
sudo systemctl stop waydroid-container
sudo systemctl stop waydroid-container
```

run weston and from the terminal run 
```waydroid show-full-ui```
