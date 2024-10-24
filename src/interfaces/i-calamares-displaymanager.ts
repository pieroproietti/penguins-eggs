/**
 * ./src/interfaces/i-calamares-displaymanager.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresDisplaymanager {
    displaymanagers: string [];
    basicSetup: boolean;
    sysconfigSetup: boolean;
    defaultDesktopEnvironment?: DesktopEnvironment;
}

export interface DesktopEnvironment {
    executable: string;
    desktopFile: string;
}