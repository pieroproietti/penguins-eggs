/**
 * ./src/interfaces/i-calamares-packages.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresPackages {
    backend: 'apk' | 'apt' | 'dnf' | 'dnf5' | 'entropy' | 'luet' | 'packagekit' | 'pacman' | 'pamac' | 'portage' | 'yum' | 'zypp' | 'dummy';
    update_db?: boolean;
    update_system?: boolean;
    skip_if_no_internet?: boolean;
    pacman?: PacmanConfig;
    operations?: Operation[];
}

export interface PacmanConfig {
    num_retries?: number;
    disable_download_timeout?: boolean;
    needed_only?: boolean;
}

export interface Operation {
    install?: any[];
    remove?: any[];
    try_install?: any[];
    try_remove?: any[];
    localInstall?: any[];
    source?: string;
}