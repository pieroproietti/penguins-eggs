/**
 * ./src/interfaces/i-calamares-branding.ts
 * penguins-eggs v.25.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * Questa interfaccia è allineata con la struttura reale di branding.desc
 * (basata sull'output 'cat /etc/calamares/branding/eggs/branding.desc').
 */

/**
 * 💡 Interfaccia per la sezione 'strings'
 * Contiene le informazioni testuali del prodotto.
 */
export interface IBrandingStrings {
    bootloaderEntryName: string;
    knownIssuesUrl: string;
    productName: string;
    productUrl: string;
    releaseNotesUrl: string;
    shortProductName: string;
    shortVersion: string;
    shortVersionedName: string;
    supportUrl: string;
    version: string;
    versionedName: string;
}

/**
 * 💡 Interfaccia per la sezione 'images'
 * Contiene i nomi dei file delle risorse grafiche.
 */
export interface IBrandingImages {
    productIcon: string;
    productLogo: string;
    productWelcome: string;
}

/**
 * 💡 Interfaccia per la sezione 'style'
 * Contiene le definizioni dei colori per l'interfaccia.
 * Nota: Sono incluse sia le varianti con maiuscola che minuscola trovate nel tuo file.
 */
export interface IBrandingStyle {
    SidebarBackground: string;
    SidebarBackgroundCurrent: string;
    SidebarText: string;
    SidebarTextCurrent: string;
    sidebarBackground: string;
    sidebarBackgroundCurrent: string;
    sidebarText: string;
    sidebarTextCurrent: string;
}


/**
 * 💡 Interfaccia Principale: IBranding
 * Mappa la struttura radice del file YAML branding.desc.
 */
export interface IBranding {
    // Campi di primo livello trovati:
    componentName: string;
    slideshow: string;
    slideshowAPI: number;
    welcomeStyleCalamares: boolean;

    // Sezioni complesse:
    images: IBrandingImages;
    strings: IBrandingStrings;
    style: IBrandingStyle;

    // Se ci fossero altri campi non presenti nel tuo YAML ma che Calamares potrebbe usare,
    // andrebbero aggiunti qui come opzionali (es. window_width?: number).
}