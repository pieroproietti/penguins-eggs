clear
#sudo apt install waydroid
#sudo waydroid init
echo "check in /var/lib/waydroid/waydroid_base.prop"
echo "For KVM sortware renderndi, edit:"
echo "ro.hardware.gralloc=default"
echo "ro.hardware.egl=swiftshader"
echo "sudo systemctl stop waydroid-container"
echo "sudo systemctl start waydroid-container"
echo "waydroid show-full-ui"

