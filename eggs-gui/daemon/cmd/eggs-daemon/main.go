package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/eggs-gui/daemon/internal/rpc"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	server := rpc.NewServer()

	// Handle graceful shutdown
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigCh
		log.Println("shutting down...")
		server.Stop()
		os.Exit(0)
	}()

	if err := server.Start(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
