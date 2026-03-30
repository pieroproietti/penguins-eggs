"""Tests for KernelVersion parsing and comparison."""
import pytest
from lkm.core.kernel import KernelVersion


class TestKernelVersionParse:
    def test_three_part(self):
        v = KernelVersion.parse("6.12.3")
        assert v.major == 6
        assert v.minor == 12
        assert v.patch == 3
        assert v.extra == ""

    def test_two_part(self):
        v = KernelVersion.parse("6.12")
        assert v.major == 6
        assert v.minor == 12
        assert v.patch == 0

    def test_with_extra(self):
        v = KernelVersion.parse("6.12.3-xanmod1")
        assert v.extra == "-xanmod1"

    def test_rc(self):
        v = KernelVersion.parse("6.13-rc4")
        assert v.major == 6
        assert v.minor == 13
        assert v.extra == "-rc4"

    def test_invalid(self):
        with pytest.raises(ValueError):
            KernelVersion.parse("not-a-version")

    def test_str_roundtrip(self):
        s = "6.12.3-lkf"
        assert str(KernelVersion.parse(s)) == s


class TestKernelVersionComparison:
    def test_less_than(self):
        assert KernelVersion.parse("6.1.0") < KernelVersion.parse("6.12.0")

    def test_equal(self):
        assert KernelVersion.parse("6.12.3") == KernelVersion.parse("6.12.3")

    def test_greater_than(self):
        assert KernelVersion.parse("6.12.0") > KernelVersion.parse("6.1.0")

    def test_sort(self):
        versions = ["6.1.0", "6.12.3", "5.15.0", "6.6.0"]
        parsed   = [KernelVersion.parse(v) for v in versions]
        sorted_  = sorted(parsed)
        assert [str(v) for v in sorted_] == ["5.15.0", "6.1.0", "6.6.0", "6.12.3"]

    def test_hash(self):
        v1 = KernelVersion.parse("6.12.3")
        v2 = KernelVersion.parse("6.12.3")
        assert hash(v1) == hash(v2)
        assert v1 in {v2}
