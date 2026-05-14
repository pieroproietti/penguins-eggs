Vagrant.configure("2") do |config|

  # 已带桌面的 Debian 镜像
  config.vm.box = "perk/debian-12-xfce"

  config.vm.hostname = "debian-desktop"

  config.vm.provider "virtualbox" do |vb|

    vb.name = "debian12-xfce"

    vb.gui = true

   
    vb.memory = 4096
    vb.cpus = 2

   
    vb.customize ["modifyvm", :id, "--vram", "128"]

  
    vb.customize ["modifyvm", :id, "--accelerate3d", "on"]

    vb.customize ["modifyvm", :id, "--graphicscontroller", "vmsvga"]
  end

  # 共享目录
  config.vm.synced_folder ".", "/vagrant"

end