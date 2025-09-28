/**
 * ./src/interfaces/i-calamares-displaymanager.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
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