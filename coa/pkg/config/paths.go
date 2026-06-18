package config

import "path/filepath"

const (
	StagingDir      = "/tmp/coa"
	DefaultWorkPath = "/home/eggs"
	LogFile         = "/var/log/oa-tools.log"
)

var (
	LuksCryptoArgs = filepath.Join(StagingDir, "luks.args")
	PlanFile       = filepath.Join(StagingDir, "oa-plan.json")
	ExcludeList    = filepath.Join(StagingDir, "excludes.list")
	BootloadersDir = filepath.Join(StagingDir, "bootloaders")
)
