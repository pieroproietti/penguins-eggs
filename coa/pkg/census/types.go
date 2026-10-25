package census

import (
	"time"

	"coa/pkg/distro"
)

const (
	DefaultEndpoint = "https://penguins-eggs.net/api/census"
	DefaultTimeout  = 2500 * time.Millisecond

	machineIDPath            = "/etc/machine-id"
	dbusMachineIDPath        = "/var/lib/dbus/machine-id"
	systemCensusIDPath       = "/etc/penguins-eggs/.census_id"
	systemCensusDirDPath     = "/etc/penguins-eggs.d/.census_id"
	systemCensusJSONPath     = "/etc/penguins-eggs/census.json"
	systemCensusDirDJSONPath = "/etc/penguins-eggs.d/census.json"
	systemParentIDPath       = "/etc/penguins-eggs.d/parent-id"
	systemParentIDDirDPath   = "/etc/penguins-eggs/parent-id"
)

// Endpoint can be overridden in tests.
var Endpoint = DefaultEndpoint

// DistroInfo represents the distribution metadata in the census payload.
type DistroInfo struct {
	ID       string `json:"id"`
	Like     string `json:"like"`
	Codename string `json:"codename"`
	Release  string `json:"release"`
}

// SystemInfo represents the host system metadata in the census payload.
type SystemInfo struct {
	Arch          string `json:"arch"`
	Desktop       string `json:"desktop"`
	DisplayServer string `json:"display_server"`
	Virt          string `json:"virt"`
	Init          string `json:"init"`
}

// OptionsInfo represents the execution options in the census payload.
type OptionsInfo struct {
	Clone bool `json:"clone"`
}

// Payload defines the JSON structure sent to the census endpoint.
type Payload struct {
	UUID        string      `json:"uuid"`
	ParentID    string      `json:"parent_id,omitempty"`
	EggsVersion string      `json:"eggs_version"`
	Action      string      `json:"action"`
	Distro      DistroInfo  `json:"distro"`
	System      SystemInfo  `json:"system"`
	Options     OptionsInfo `json:"options"`
}

// EventOptions holds the parameters passed by callers (remaster / sysinstall).
type EventOptions struct {
	Action      string
	EggsVersion string
	Anonymous   bool
	Clone       bool
	Distro      *distro.Distro
	TargetRoot  string
	TargetUser  string
	ParentID    string
}
