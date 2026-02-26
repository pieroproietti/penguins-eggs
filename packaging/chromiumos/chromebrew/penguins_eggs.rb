# Chromebrew package definition for penguins-eggs
# This is a reference for the package merged upstream at:
# https://github.com/chromebrew/chromebrew/pull/13942
#
# The upstream Chromebrew package installs via AppImage.
# This version adds ChromiumOS family awareness.

require 'buildsystems/pip'

class Penguins_eggs < Package
  description 'A remaster system tool for creating live ISOs from running systems'
  homepage 'https://penguins-eggs.net/'
  version '26.2.20'
  license 'MIT'
  compatibility 'x86_64'
  source_url "https://github.com/pieroproietti/penguins-eggs/releases/download/v#{version}/penguins-eggs-v#{version}-linux-x64.tar.gz"
  source_sha256 'FIXME'

  depends_on 'squashfs_tools'
  depends_on 'xorriso'
  depends_on 'rsync'
  depends_on 'dosfstools'
  depends_on 'grub'
  depends_on 'syslinux'

  def self.install
    FileUtils.mkdir_p "#{CREW_DEST_PREFIX}/lib/penguins-eggs"
    system "cp -r . #{CREW_DEST_PREFIX}/lib/penguins-eggs/"
    FileUtils.mkdir_p "#{CREW_DEST_PREFIX}/bin"
    FileUtils.ln_sf "#{CREW_PREFIX}/lib/penguins-eggs/bin/run", "#{CREW_DEST_PREFIX}/bin/eggs"
  end

  def self.postinstall
    puts 'Penguins-eggs installed.'.lightblue
    puts 'Run "sudo eggs dad -d" to configure.'.lightblue
    puts ''
    puts 'ChromiumOS family support: ChromiumOS, ChromeOS, FydeOS, ThoriumOS, WayneOS, Brunch'.lightblue
  end
end
