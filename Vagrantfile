# -*- mode: ruby -*-
# vi: set ft=ruby :

BOX_STORE = File.expand_path('~/Vagrant-boxes')

distros = {
  'debian' => {
    :box => "#{BOX_STORE}/debian.box",
    :hostname => 'naked',
    :disk => 8,
    :pkg => '...' 
  },
  'arch' => {
    :box => "#{BOX_STORE}/arch.box",
    :hostname => 'naked',
    :disk => 8,
    :pkg => '...'
  },
  'manjaro' => {
    :box => "#{BOX_STORE}/manjaro.box",
    :hostname => 'naked',
    :disk => 8,
    :pkg => '...'
  },
  'fedora' => {
    :box => "#{BOX_STORE}/fedora.box",
    :hostname => 'naked',
    :disk => 25,
    :pkg => '...'
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
      subconfig.vm.synced_folder ".", "/home/vagrant/oa-tools", 
        type: "9p", 
        disabled: false, 
        mount_options: ["version=9p2000.L", "trans=virtio", "access=any", "uid=1000", "gid=1000"]

      # Provisioning automatico specifico per la distribuzione scelta
      subconfig.vm.provision "shell", inline: settings[:pkg]
    end
  end
end
