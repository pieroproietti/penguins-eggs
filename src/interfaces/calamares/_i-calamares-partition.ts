/**
 * Interfaccia TypeScript per il file di configurazione `partition.conf` di Calamares 3.4
 */


/**
 * Tipi di scelte per lo swap disponibili per l'utente.
 */
export type UserSwapChoice = 'none' | 'small' | 'suspend' | 'file';

/**
 * Tipi di tabella di partizione.
 */
export type PartitionTableType = 'gpt' | 'msdos';

/**
 * Configurazione per la partizione di sistema EFI.
 */
export interface EfiConfig {
    /**
     * Punto di montaggio della partizione di sistema EFI (es. "/boot/efi").
     * @default "/boot/efi"
     */
    mountPoint?: string;

    /**
     * Dimensione raccomandata per la partizione EFI (es. "300MiB").
     * @default "300MiB"
     */
    recommendedSize?: string;

    /**
     * Dimensione minima assoluta per la partizione EFI (es. "32MiB").
     */
    minimumSize?: string;

    /**
     * Etichetta (PARTLABEL) della partizione EFI.
     */
    label?: string;
}

/**
 * Restrizioni del filesystem per una specifica directory o punto di montaggio.
 */
export interface DirectoryFilesystemRestriction {
    /**
     * "any", un percorso completo come "/", o "efi".
     */
    directory?: string;
    
    /**
     * "efi" per la partizione EFI o un percorso.
     */
    mountpoint?: string;

    /**
     * Lista dei filesystem consentiti. ["all"] per consentirli tutti.
     */
    allowedFilesystemTypes: string[];

    /**
     * Se true, la restrizione si applica solo se la directory è un punto di montaggio separato.
     * @default false
     */
    onlyWhenMountpoint?: boolean;
}

/**
 * Definizione di una partizione in un layout personalizzato.
 */
export interface PartitionLayoutEntry {
    /**
     * Etichetta del filesystem e nome della partizione (solo gpt).
     */
    name: string;

    /**
     * UUID della partizione (opzionale, solo gpt).
     */
    uuid?: string;
    
    /**
     * Tipo di partizione (opzionale, solo gpt).
     */
    type?: string;

    /**
     * Attributi della partizione (opzionale, solo gpt).
     */
    attributes?: number;

    /**
     * Tipo di filesystem (es. "ext4", "btrfs").
     */
    filesystem?: string;

    /**
     * Se true, questa partizione è esente dalla crittografia se abilitata.
     * @default false
     */
    noEncrypt?: boolean;

    /**
     * Punto di montaggio della partizione (es. "/", "/home").
     */
    mountPoint?: string;

    /**
     * Dimensione della partizione in byte (es. "3G") o percentuale (es. "20%").
     */
    size: string | number;

    /**
     * Dimensione minima della partizione (opzionale).
     */
    minSize?: string;

    /**
     * Dimensione massima della partizione (opzionale).
     */
    maxSize?: string;

    /**
     * Caratteristiche del filesystem (opzionale).
     */
    features?: Record<string, boolean | number | string>;
}





export interface CalamaresPartitionConfig {
    /**
     * Opzioni per la partizione di sistema EFI.
     */
    efi?: EfiConfig;

    /**
     * Consente all'utente di selezionare una dimensione di swap nella partizione automatica.
     */
    userSwapChoices?: UserSwapChoice[];

    /**
     * Nome della partizione di swap (PARTLABEL, solo gpt).
     */
    swapPartitionName?: string;
    
    /**
     * Generazione LUKS da utilizzare (luks1 o luks2).
     * @default "luks1"
     */
    luksGeneration?: 'luks1' | 'luks2';

    /**
     * Consente la crittografia quando si utilizza ZFS.
     * @default true
     */
    allowZfsEncryption?: boolean;

    /**
     * Disegna correttamente le partizioni annidate (es. logiche).
     * @default false
     */
    drawNestedPartitions?: boolean;

    /**
     * Mostra/nasconde le etichette delle partizioni nella pagina di partizionamento manuale.
     * @default true
     */
    alwaysShowPartitionLabels?: boolean;
    
    /**
     * Se false, nasconde il pulsante "Partizionamento manuale".
     * @default true
     */
    allowManualPartitioning?: boolean;

    /**
     * Se false, non mostra l'avviso "Partizione di boot non crittografata".
     * @default true
     */
    showNotEncryptedBootMessage?: boolean;

    /**
     * Selezione iniziale nella pagina di scelta del partizionamento.
     * @default "none"
     */
    initialPartitioningChoice?: 'none' | 'erase' | 'replace' | 'alongside' | 'manual';

    /**
     * Selezione iniziale per lo swap.
     * @default "none"
     */
    initialSwapChoice?: UserSwapChoice;

    /**
     * Se true, lascia 16MB vuoti all'inizio di un'unità per il bootloader u-boot.
     * @default false
     */
    armInstall?: boolean;

    /**
     * Tipo di tabella delle partizioni di default ("gpt" o "msdos").
     */
    defaultPartitionTableType?: PartitionTableType;

    /**
     * Se true, crea un layout di partizioni adatto per un bootloader ibrido (BIOS + EFI).
     * @default false
     */
    createHybridBootloaderLayout?: boolean;

    /**
     * Limita l'installazione a dischi con i tipi di tabella delle partizioni specificati.
     */
    requiredPartitionTableType?: PartitionTableType | PartitionTableType[];
    
    /**
     * Tipo di filesystem di default (es. "btrfs").
     * @default "ext4"
     */
    defaultFileSystemType?: string;

    /**
     * Tipi di filesystem selezionabili quando si cancella il disco.
     */
    availableFileSystemTypes?: string[];

    /**
     * Specifica restrizioni sui filesystem per varie directory.
     */
    directoryFilesystemRestrictions?: DirectoryFilesystemRestriction[];

    /**
     * Elenco di punti di montaggio essenziali da non smontare.
     */
    essentialMounts?: string[];
    
    /**
     * Abilita/disabilita la funzionalità LUKS nelle modalità di partizionamento automatico.
     * @default true
     */
    enableLuksAutomatedPartitioning?: boolean;

    /**
     * Se true, preseleziona la casella di crittografia.
     * @default false
     */
    preCheckEncryption?: boolean;

    /**
     * Configurazione del supporto LVM.
     */
    lvm?: {
        /** @default true */
        enable?: boolean;
    };

    /**
     * Specifica un layout di partizioni personalizzato.
     */
    partitionLayout?: PartitionLayoutEntry[];
    
    /**
     * Spazio di archiviazione minimo richiesto in GiB (usare l'impostazione nel modulo 'welcome').
     */
    requiredStorage?: number;
}