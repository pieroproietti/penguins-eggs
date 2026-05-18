# -*- mode: ruby -*-
# vi: set ft=ruby :

# Seleziona la distro. Di default usa 'arch' se la variabile DISTRO non è passata.
distro = ENV['DISTRO'] || 'arch'

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
  }

}

# Verifica se la distro richiesta è supportata, altrimenti fallisce con eleganza
if !distros.has_key?(distro)
  puts "Distro '#{distro}' non supportata. Usa 'arch' o 'debian'."
  exit 1
end

Vagrant.configure("2") do |config|
  config.vm.box = distros[distro][:box]

  config.vm.provider "libvirt" do |lv|
    lv.memory = 4096
    lv.cpus = 4
    # Configurazione fondamentale per la Nested Virtualization (KVM dentro KVM)
    lv.cpu_mode = "host-passthrough"
  end

  # Condivisione con mappatura forzata dell'utente vagrant dentro la VM
  config.vm.synced_folder ".", "/home/vagrant/oa-tools", 
    type: "9p", 
    disabled: false, 
    mount_options: ["version=9p2000.L", "trans=virtio", "access=any", "uid=1000", "gid=1000"]

  # Provisioning automatico: installa i pacchetti necessari al boot
  config.vm.provision "shell", inline: distros[distro][:pkg]
end
