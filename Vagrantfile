# -*- mode: ruby -*-
# vi: set ft=ruby :

# Tabella di configurazione delle distribuzioni supportate
distros = {
  'arch' => { 
    :box => 'generic/arch',
    :hostname => 'naked',
    :pkg => 'hostnamectl set-hostname naked && modprobe overlay && echo "overlay" > /etc/modules-load.d/overlay.conf && pacman-key --init && pacman-key --populate archlinux && pacman -Sy archlinux-keyring --noconfirm && pacman -Su --noconfirm && pacman -S --noconfirm base-devel go git xorriso squashfs-tools bash-completion' 
  },

  'debian' => { 
    :box => 'generic/debian12', 
    :hostname => 'naked',
    :pkg => 'hostnamectl set-hostname naked && rm -rf /etc/apt/sources.list.d/* && echo -e "deb http://deb.debian.org/debian trixie main non-free-firmware\ndeb-src http://deb.debian.org/debian trixie main non-free-firmware" > /etc/apt/sources.list && export DEBIAN_FRONTEND=noninteractive && apt-get purge -y postfix && apt-get update && echo "grub-pc grub-pc/install_devices_empty boolean true" | debconf-set-selections && echo "grub-pc grub-pc/install_devices multiselect" | debconf-set-selections && apt-get dist-upgrade -y -o Dpkg::Options::="--force-confold" -o Dpkg::Options::="--force-confdef" && apt-get install -y build-essential golang git xorriso squashfs-tools bash-completion' 
  },

  'fedora' => {
    :box => './Fedora-Cloud-Base-Vagrant-libvirt-43-1.6.x86_64.vagrant.libvirt.box',
    :hostname => 'naked-fedora',
    :disk => 8, # <--- Assicurati che ci sia questo!
    :pkg => 'sudo dnf install -y make gcc fakeroot golang git xorriso squashfs-tools bash-completion rpm-build rpm-devel'
  },

  'manjaro' => {
    :box => 'adnuntius/manjaro',
    :hostname => 'naked',
    :disk => 8,
    :pkg => 'hostnamectl set-hostname naked && pacman-key --init && pacman-key --populate manjaro && pacman -Syu --noconfirm && pacman -S --noconfirm base-devel go git xorriso squashfs-tools bash-completion'
  }
}

Vagrant.configure("2") do |config|
  
  # Ciclo magico che definisce ogni macchina come entità indipendente
  distros.each do |name, settings|
    
    # Crea una VM esplicita chiamandola con la chiave del dizionario (arch, debian, fedora, manjaro)
    config.vm.define name do |subconfig|
      
      subconfig.vm.box = settings[:box]
      subconfig.vm.hostname = settings[:hostname]

      subconfig.vm.provider "libvirt" do |lv|
        lv.memory = 4096
        lv.cpus = 4
        # Configurazione fondamentale per la Nested Virtualization (KVM dentro KVM)
        lv.cpu_mode = "host-passthrough"
      end

      # Condivisione con mappatura forzata dell'utente vagrant dentro la VM tramite 9p
      subconfig.vm.synced_folder ".", "/home/vagrant/penguins-eggs", 
        type: "9p", 
        disabled: false, 
        mount_options: ["version=9p2000.L", "trans=virtio", "access=any", "uid=1000", "gid=1000"]

      # Provisioning automatico specifico per la distribuzione scelta
      subconfig.vm.provision "shell", inline: settings[:pkg]
    end
  end
end
