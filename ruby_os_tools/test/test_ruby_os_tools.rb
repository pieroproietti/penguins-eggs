require "minitest/autorun"
require "tmpdir"
require "ruby_os_tools"

class RubyOSToolsTest < Minitest::Test
  def test_version_format
    assert_match(/^\d+\.\d+\.\d+$/, RubyOSTools::VERSION)
  end

  def test_distro_detect_returns_struct
    distro = RubyOSTools::Distro.detect
    assert_respond_to distro, :id
    assert_respond_to distro, :family
  end

  def test_generate_exclude_list_creates_file
    Dir.mktmpdir do |dir|
      path = RubyOSTools::Engine.generate_exclude_list("standard", dir)
      assert File.exist?(path)
      content = File.read(path)
      assert_includes content, "dev/*"
    end
  end
end
