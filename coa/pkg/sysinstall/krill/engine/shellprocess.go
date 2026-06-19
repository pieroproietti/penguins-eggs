// Esecuzione dei moduli shellprocess di Calamares (es. oa_bootloader,
// oa_removelink): stessi file .conf, stessa semantica. Un comando che
// inizia con "-" può fallire senza interrompere l'installazione.
package engine

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// ScriptList gestisce la decodifica YAML sia da stringa singola che da array
type ScriptList []string

func (sl *ScriptList) UnmarshalYAML(value *yaml.Node) error {
	// Caso 1: È una lista (Sequence)
	if value.Kind == yaml.SequenceNode {
		var list []string
		if err := value.Decode(&list); err != nil {
			return err
		}
		*sl = list
		return nil
	}

	// Caso 2: È una stringa singola (Scalar)
	if value.Kind == yaml.ScalarNode {
		var single string
		if err := value.Decode(&single); err != nil {
			return err
		}
		*sl = []string{single}
		return nil
	}

	return fmt.Errorf("il campo script deve essere una stringa o una lista di stringhe")
}

// Usiamo il tipo custom ScriptList
type shellprocessConf struct {
	DontChroot bool       `yaml:"dontChroot"`
	Timeout    int        `yaml:"timeout"`
	Script     ScriptList `yaml:"script"`
}

func (c *ctx) runShellprocess(id string) error {
	confName := c.plan.Instances[id]
	if confName == "" {
		confName = "shellprocess_" + id + ".conf"
	}
	confPath := filepath.Join(c.plan.ConfigRoot, "modules", confName)

	data, err := os.ReadFile(confPath)
	if err != nil {
		return fmt.Errorf("configurazione shellprocess %s: %w", id, err)
	}
	var conf shellprocessConf
	if err := yaml.Unmarshal(data, &conf); err != nil {
		return fmt.Errorf("parse %s: %w", confName, err)
	}

	for _, line := range conf.Script {
		command := strings.TrimSpace(line)
		tolerant := strings.HasPrefix(command, "-")
		if tolerant {
			command = strings.TrimSpace(strings.TrimPrefix(command, "-"))
		}
		if command == "" {
			continue
		}

		var err error
		if conf.DontChroot {
			err = c.run("/bin/sh", "-c", command)
		} else {
			err = c.chroot("/bin/sh", "-c", command)
		}
		if err != nil {
			if tolerant {
				c.logf("tolerated command failed: %s (%v)", command, err)
				continue
			}
			return fmt.Errorf("command %q: %w", command, err)
		}
	}
	return nil
}
