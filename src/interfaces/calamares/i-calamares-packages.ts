/**
 * ./src/interfaces/i-calamares-packages.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresPackages {
  backend:
    | "apk"
    | "apt"
    | "dnf5"
    | "dnf"
    | "dummy"
    | "entropy"
    | "luet"
    | "packagekit"
    | "pacman"
    | "pamac"
    | "portage"
    | "yum"
    | "zypp";
  operations?: {
    install?: unknown[];
    localInstall?: unknown[];
    remove?: unknown[];
    source?: string;
    try_install?: unknown[];
    try_remove?: unknown[];
  }[];
  pacman?: {
    disable_download_timeout?: boolean;
    needed_only?: boolean;
    num_retries?: number;
  };
  skip_if_no_internet?: boolean;
  update_db?: boolean;
  update_system?: boolean;
}
