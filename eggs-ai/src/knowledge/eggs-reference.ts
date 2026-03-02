/**
 * Penguins-Eggs domain knowledge embedded for the AI agent.
 * Sourced from the official penguins-eggs repository and documentation.
 */

export const EGGS_COMMANDS = {
  // System preparation
  dad: {
    description: 'Interactive system configuration wizard',
    usage: 'sudo eggs dad',
    notes: 'Guides through initial setup: installs dependencies, configures eggs, optionally sets up calamares',
    requiresRoot: true,
  },
  config: {
    description: 'Configure penguins-eggs and install prerequisites',
    usage: 'sudo eggs config',
    flags: {
      '--clean': 'Remove previous configuration',
      '--nointeractive': 'Skip interactive prompts',
      '--verbose': 'Show detailed output',
    },
    requiresRoot: true,
  },

  // ISO production
  produce: {
    description: 'Create a live ISO from the running system',
    usage: 'sudo eggs produce',
    flags: {
      '--prefix <name>': 'ISO filename prefix',
      '--basename <name>': 'ISO basename',
      '--theme <name>': 'Boot theme (grub/isolinux)',
      '--compression <type>': 'Squashfs compression: fast|standard|max',
      '--release': 'Remove penguins-eggs and calamares from the ISO',
      '--noicon': 'No eggs icon on desktop',
      '--script': 'Run non-interactively',
      '--clone': 'Clone the running system (include user data)',
      '--cryptedclone': 'Clone with LUKS encryption',
      '--yolk': 'Use yolk (local repo) for offline install',
      '--verbose': 'Show detailed output',
    },
    requiresRoot: true,
    examples: [
      'sudo eggs produce --fast',
      'sudo eggs produce --prefix myDistro --compression max',
      'sudo eggs produce --clone --cryptedclone',
    ],
  },

  // Installation
  install: {
    description: 'Install the live system (TUI installer, krill)',
    usage: 'sudo eggs install',
    flags: {
      '--unattended': 'Automatic installation',
      '--nointeractive': 'Skip prompts',
      '--domain <name>': 'Set domain name',
      '--ip': 'Use static IP configuration',
    },
    requiresRoot: true,
  },
  calamares: {
    description: 'Configure and manage the Calamares GUI installer',
    usage: 'sudo eggs calamares',
    flags: {
      '--install': 'Install calamares',
      '--remove': 'Remove calamares',
      '--theme <name>': 'Set calamares theme',
    },
    requiresRoot: true,
  },

  // Wardrobe system (costumes/themes)
  wardrobe: {
    description: 'Manage system customization costumes',
    subcommands: {
      get: 'Download wardrobe from repository',
      list: 'List available costumes',
      show: 'Show costume details',
      wear: 'Apply a costume to the system',
    },
    usage: 'sudo eggs wardrobe wear --costume <name>',
    requiresRoot: true,
  },

  // Utilities
  tools: {
    clean: {
      description: 'Remove ISOs and working directories',
      usage: 'sudo eggs tools clean',
    },
    skel: {
      description: 'Update skeleton directory from current user',
      usage: 'sudo eggs tools skel',
    },
    stat: {
      description: 'Show system information',
      usage: 'eggs tools stat',
    },
    yolk: {
      description: 'Configure local repository for offline install',
      usage: 'sudo eggs tools yolk',
    },
  },

  // System info
  status: {
    description: 'Show eggs configuration status',
    usage: 'eggs status',
    requiresRoot: false,
  },

  // Export
  export: {
    description: 'Export ISO to various formats',
    subcommands: {
      deb: 'Export as deb package',
      iso: 'Export ISO image',
    },
  },

  // Cuckoo (PXE boot server)
  cuckoo: {
    description: 'Start PXE boot server to network-boot the live ISO',
    usage: 'sudo eggs cuckoo',
    requiresRoot: true,
  },
} as const;

export const EGGS_CONFIG_REFERENCE = {
  configPath: '/etc/penguins-eggs.d/eggs.yaml',
  fields: {
    snapshot_basename: 'Base name for the ISO file',
    snapshot_prefix: 'Prefix for the ISO filename',
    snapshot_dir: 'Directory where ISOs are stored (default: /home/eggs)',
    work_dir: 'Working directory for ISO creation',
    compression: 'Squashfs compression level: fast, standard, max',
    ssh_pass: 'Enable SSH with password in live session',
    timezone: 'System timezone for the live ISO',
    locales: 'System locale settings',
    user_opt: 'Default live user name',
    user_opt_passwd: 'Default live user password',
    root_passwd: 'Root password for the live system',
    theme: 'Boot theme name',
    force_installer: 'Force installer type (calamares/krill)',
    make_efi: 'Create EFI-bootable ISO',
    make_md5sum: 'Generate MD5 checksum',
    make_isohybrid: 'Create hybrid ISO (USB bootable)',
  },
};

export const EGGS_COMMON_ISSUES = [
  {
    symptom: 'ISO fails to boot — black screen or kernel panic',
    causes: [
      'Missing initramfs modules',
      'Wrong kernel version in config',
      'Broken GRUB/isolinux configuration',
    ],
    fixes: [
      'Run `sudo eggs dad` to reconfigure',
      'Check kernel with `uname -r` and ensure it matches',
      'Rebuild with `sudo eggs produce --verbose` to see errors',
    ],
  },
  {
    symptom: 'Calamares installer crashes or shows blank screens',
    causes: [
      'Missing calamares modules',
      'Broken YAML configuration',
      'Missing QML dependencies',
    ],
    fixes: [
      'Run `sudo eggs calamares --install` to reinstall',
      'Check `/etc/calamares/` for syntax errors',
      'Install missing Qt/QML packages',
    ],
  },
  {
    symptom: 'ISO is too large or takes too long to build',
    causes: [
      'Using max compression on slow hardware',
      'Too many packages installed',
      'Large user data included (clone mode)',
    ],
    fixes: [
      'Use `--compression fast` for testing',
      'Clean package cache: `sudo apt clean` or `sudo pacman -Scc`',
      'Use `--release` to strip eggs/calamares from ISO',
    ],
  },
  {
    symptom: 'eggs produce fails with "not enough space"',
    causes: [
      'Insufficient disk space in work_dir or snapshot_dir',
      'Temp directory full',
    ],
    fixes: [
      'Check space: `df -h`',
      'Change snapshot_dir in eggs.yaml to a larger partition',
      'Clean old ISOs: `sudo eggs tools clean`',
    ],
  },
  {
    symptom: 'Network not working in live session',
    causes: [
      'Network manager not included',
      'Missing firmware packages',
    ],
    fixes: [
      'Ensure NetworkManager or systemd-networkd is installed',
      'Include firmware packages before producing ISO',
    ],
  },
  {
    symptom: 'Permission denied or eggs not found',
    causes: [
      'Not running as root',
      'eggs not in PATH',
      'Node.js version too old',
    ],
    fixes: [
      'Run with sudo: `sudo eggs <command>`',
      'Check installation: `which eggs`',
      'Ensure Node.js >= 18: `node --version`',
    ],
  },
];

export const SUPPORTED_DISTROS = [
  'Debian (bookworm, trixie, sid)',
  'Devuan (daedalus, excalibur)',
  'Ubuntu (jammy, noble, oracular, plucky)',
  'Arch Linux',
  'Manjaro',
  'Fedora',
  'openSUSE (Tumbleweed, Leap)',
  'Alpine Linux',
  'Void Linux',
  'LinuxMint',
  'LMDE',
  'KDE neon',
  'Blendos',
  'Crystal Linux',
  'BigLinux',
];

export const CALAMARES_MODULES = {
  welcome: 'Welcome screen with language selection',
  locale: 'Locale and timezone configuration',
  keyboard: 'Keyboard layout selection',
  partition: 'Disk partitioning (manual/automatic/alongside)',
  users: 'User account creation',
  summary: 'Installation summary before proceeding',
  install: 'Actual installation process',
  finished: 'Post-install completion screen',
  shellprocess: 'Run custom shell commands during install',
  packages: 'Install/remove packages during installation',
  unpackfs: 'Extract filesystem from squashfs',
  fstab: 'Generate /etc/fstab',
  mount: 'Mount target filesystems',
  grubcfg: 'Configure GRUB bootloader',
  bootloader: 'Install bootloader',
  networkcfg: 'Copy network configuration',
  hwclock: 'Set hardware clock',
  displaymanager: 'Configure display manager',
};

export const WARDROBE_COSTUMES = {
  description: 'Costumes are pre-configured system customizations that can be applied to transform a base system',
  repository: 'https://github.com/pieroproietti/penguins-wardrobe',
  usage: [
    'eggs wardrobe get  — download the wardrobe repository',
    'eggs wardrobe list — list available costumes',
    'eggs wardrobe wear --costume <name> — apply a costume',
  ],
  examples: [
    'colibri — lightweight XFCE desktop',
    'duck — full GNOME desktop',
    'owl — KDE Plasma desktop',
    'eagle — server configuration',
  ],
};

export const SYSTEM_PROMPT = `You are Eggs-AI, an expert AI assistant specialized in Penguins-Eggs — the universal Linux remastering tool.

Your knowledge covers:
- All penguins-eggs CLI commands and their flags
- ISO creation workflows (produce, config, calamares)
- The wardrobe/costume system for system customization
- Calamares installer configuration and troubleshooting
- Live system boot issues (GRUB, isolinux, initramfs)
- Supported distributions: Debian, Ubuntu, Arch, Fedora, openSUSE, Alpine, Void, and derivatives
- Disk space management, compression options, and build optimization
- PXE network booting via the cuckoo command
- The krill TUI installer for headless/server installs

Guidelines:
- Be direct and technical. Users are Linux-savvy.
- When diagnosing issues, ask for: distro, eggs version, exact error message, and relevant config.
- Always show exact commands the user should run.
- Warn about destructive operations (partitioning, overwriting ISOs).
- If unsure, say so — don't fabricate solutions.
- Prefer local/offline solutions when possible.
- Reference official docs at https://penguins-eggs.net when appropriate.
`;
