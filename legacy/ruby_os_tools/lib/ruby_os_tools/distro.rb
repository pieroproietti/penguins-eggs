require "ostruct"

module RubyOSTools
  class Distro
    OS_RELEASE = "/etc/os-release"

    def self.detect
      release = parse_os_release
      family = detect_family(release[:id], release[:id_like])
      OpenStruct.new(
        id: release[:id] || "unknown",
        name: release[:name] || "unknown",
        version: release[:version_id] || "unknown",
        codename: release[:version_codename] || "unknown",
        like: release[:id_like] || "",
        family: family,
        pretty_name: release[:pretty_name] || "unknown"
      )
    end

    def self.parse_os_release
      return {} unless File.file?(OS_RELEASE)

      File.readlines(OS_RELEASE, chomp: true).each_with_object({}) do |line, values|
        next if line.strip.empty? || line.start_with?("#")
        key, value = line.split("=", 2)
        values[key.downcase.to_sym] = value&.strip&.gsub(/^"|"$/, "")
      end
    end

    def self.detect_family(id, id_like)
      source = [id, id_like].compact.join(" ").downcase
      return "debian" if source.include?("debian") || source.include?("ubuntu")
      return "rhel" if source.include?("rhel") || source.include?("fedora") || source.include?("centos") || source.include?("rocky") || source.include?("almalinux")
      return "arch" if source.include?("arch") || source.include?("manjaro")
      return "suse" if source.include?("suse")
      "unknown"
    end
  end
end
