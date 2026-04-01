# shared/Makefile — transpile android-shared.fu to TS and Python
#
# Usage:
#   make          — transpile (default)
#   make clean    — remove generated files
#   make check    — verify fut is installed

FUT     := fut
SOURCE  := android-shared.fu
OUT_TS  := android-shared.ts
OUT_PY  := android-shared.py

.PHONY: all clean check

all: $(OUT_TS) $(OUT_PY)

$(OUT_TS): $(SOURCE)
	$(FUT) -l ts -o $@ $<

$(OUT_PY): $(SOURCE)
	$(FUT) -l py -o $@ $<

clean:
	rm -f $(OUT_TS) $(OUT_PY)

check:
	@which $(FUT) > /dev/null 2>&1 || \
		(echo "fut not found. Install from https://github.com/fusionlanguage/fut/releases" && exit 1)
	@echo "fut $$($(FUT) --version 2>/dev/null || echo '(version unknown)') found"
