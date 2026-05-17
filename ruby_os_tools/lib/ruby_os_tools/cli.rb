require "optparse"
require "yaml"

module RubyOSTools
  class CLI
    def initialize(argv)
      @argv = argv.dup
    end

    def run
      command = @argv.shift

      case command
      when nil, "help", "-h", "--help"
        print_help
      when "version"
        puts VERSION
      when "detect"
        puts Distro.detect.to_h.to_yaml
      when "exclude"
        mode = @argv.shift || "standard"
        path = Engine.generate_exclude_list(mode)
        puts "Exclude list written to #{path}"
      else
        warn "Unknown command: #{command}"
        print_help
        exit 1
      end
    rescue StandardError => error
      warn "ERROR: #{error.message}"
      exit 1
    end

    def print_help
      puts <<~HELP
        ruby_os_tools #{VERSION}

        Usage:
          ruby_os_tools version
          ruby_os_tools detect
          ruby_os_tools exclude [standard|clone|crypted]

        Commands:
          version   Print the gem version
          detect    Detect the current Linux distribution and environment
          exclude   Generate an OS exclude list for remastering
      HELP
    end
  end
end
