require "fileutils"

module RubyOSTools
  class Engine
    DEFAULT_EXCLUDES = %w[
      dev/*
      proc/*
      sys/*
      run/*
      tmp/*
      var/tmp/*
      var/tmp/.??*
      lost+found
      home/eggs/.overlay/*
      home/eggs/.overlay/.??*
      home/eggs/isodir/*
      home/eggs/*.iso
      boot/efi/EFI
      boot/loader/entries/
      etc/fstab
      etc/mtab
      swapfile
      var/lib/docker/
      var/lib/containers/
      etc/udev/rules.d/70-persistent-cd.rules
      etc/udev/rules.d/70-persistent-net.rules
      etc/NetworkManager/system-connections/*
      etc/ssh/ssh_host_*
      var/lib/NetworkManager/secret_key
      var/cache/apt/archives/*
      var/cache/apt/*.bin
      var/cache/pacman/pkg/*
      var/cache/dnf/*
      etc/rc*.d/*cryptdisks*
    ].freeze

    GITHUB_ACTIONS_EXCLUDES = %w[
      opt/hostedtoolcache/*
      home/runner/work/*
      usr/local/lib/android/*
      usr/share/dotnet/*
      usr/lib/jvm/*
      usr/local/share/powershell/*
      usr/share/swift/*
      var/lib/gems/*
    ].freeze

    def self.generate_exclude_list(mode = "standard", base_path = "/tmp/ruby_os_tools")
      excludes = DEFAULT_EXCLUDES.dup
      if %w[clone crypted].include?(mode)
        excludes.concat([
          "root/.bash_history",
          "root/.zsh_history",
          "home/*/.bash_history",
          "home/*/.local/share/Trash/*",
          "home/*/.cache/*"
        ])
      else
        excludes.concat(["root/*", "root/.??*"])
      end

      excludes.concat(GITHUB_ACTIONS_EXCLUDES) if ci_environment?

      user_list = "/etc/oa-tools.d/exclusion.list"
      user_list = File.join("conf", "exclusion.list") unless File.file?(user_list)
      if File.file?(user_list)
        File.foreach(user_list) do |line|
          path = line.strip
          next if path.empty? || path.start_with?("#")
          excludes << path.sub(%r{^/}, "")
        end
      end

      FileUtils.mkdir_p(base_path)
      path = File.join(base_path, "excludes.list")
      File.write(path, excludes.join("\n") + "\n")
      path
    end

    def self.ci_environment?
      ENV["GITHUB_ACTIONS"] == "true" || Dir.exist?("/home/runner/work")
    end
  end
end
