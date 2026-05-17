Gem::Specification.new do |spec|
  spec.name          = "ruby_os_tools"
  spec.version       = File.read(File.expand_path("lib/ruby_os_tools/version.rb", __dir__))[/VERSION = "([^"]+)"/, 1]
  spec.summary       = "A standalone Ruby gem for OS remastering and distro orchestration"
  spec.description   = "ruby_os_tools provides a lightweight Ruby implementation of OS tooling, including distro detection, exclude list generation, and CLI helpers."
  spec.authors       = ["oa-tools Contributors"]
  spec.email         = ["dev@oa-tools.example"]
  spec.license       = "MIT"
  spec.homepage      = "https://github.com/pieroproietti/oa-tools"
  spec.required_ruby_version = ">= 3.0"

  spec.files = Dir.chdir(__dir__) do
    Dir["lib/**/*.rb"] + Dir["exe/*"] + Dir["test/**/*.rb"] + ["README_RUBY_OS_TOOLS.md", "Gemfile", "Rakefile"]
  end

  spec.require_paths = ["lib"]
  spec.executables   = ["ruby_os_tools"]
  spec.bindir        = "exe"

  spec.add_development_dependency "minitest", ">= 5.0"
end
