VERSION := 1.0.0
DAEMON_BIN := eggs-daemon
TUI_BIN := eggs-tui

.PHONY: all daemon tui desktop web clean

all: daemon tui

## Go daemon
daemon:
	cd daemon && go build -o ../bin/$(DAEMON_BIN) ./cmd/eggs-daemon

## BubbleTea TUI
tui:
	cd tui && go build -o ../bin/$(TUI_BIN) ./cmd/eggs-tui

## NodeGUI desktop (requires npm install first)
desktop:
	cd desktop && npm run build

## Web frontend (Python, no build step)
web:
	@echo "Web frontend requires: pip install -r web/requirements.txt"
	@echo "Run with: cd web && python main.py"

## Run daemon + TUI together
run: daemon tui
	./bin/$(DAEMON_BIN) &
	sleep 1
	./bin/$(TUI_BIN)
	@kill %1 2>/dev/null || true

## Run daemon only
run-daemon: daemon
	./bin/$(DAEMON_BIN)

## Run TUI only (daemon must be running)
run-tui: tui
	./bin/$(TUI_BIN)

## Run desktop (daemon must be running)
run-desktop: desktop
	cd desktop && npm start

## Run web (daemon must be running)
run-web:
	cd web && python main.py

clean:
	rm -f bin/$(DAEMON_BIN) bin/$(TUI_BIN)
	rm -rf desktop/dist

## Create Debian package
deb: daemon tui
	fpm -s dir -t deb \
		-n eggs-gui \
		-v $(VERSION) \
		--description "Unified GUI for penguins-eggs" \
		--license MIT \
		--url "https://github.com/eggs-gui/eggs-gui" \
		bin/$(DAEMON_BIN)=/usr/bin/$(DAEMON_BIN) \
		bin/$(TUI_BIN)=/usr/bin/$(TUI_BIN) \
		assets/eggs-gui.desktop=/usr/share/applications/eggs-gui.desktop
