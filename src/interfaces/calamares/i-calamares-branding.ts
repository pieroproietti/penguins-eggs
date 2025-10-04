/**
 * ./src/interfaces/i-calamares-branding.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface IBranding {
  // --- Stringhe di base del prodotto ---
  /** Il nome completo della distribuzione (es. "My Awesome OS"). */
  string_product_name: string;
  /** La versione della distribuzione (es. "2025.10"). */
  string_product_version: string;
  /** Un URL per il sito web del progetto. */
  string_product_url?: string;
  /** Un titolo per le note di rilascio. */
  string_release_title?: string;

  // --- Colori (valori CSS, es. "#RRGGBB" o "rgba(...)") ---
  /** Il colore principale usato per gli accenti (pulsanti, selezioni). */
  color_accent?: string;
  /** Colore del testo principale. */
  color_text?: string;
  /** Colore di sfondo principale della finestra. */
  color_background?: string;
  /** Colore di sfondo della barra laterale. */
  color_sidebar_background?: string;
  /** Colore del testo nella barra laterale. */
  color_sidebar_text?: string;

  // --- Loghi e Icone (percorsi relativi alla cartella del branding) ---
  /** Logo principale mostrato nell'installer. */
  logo?: string;
  /** Icona del prodotto. */
  product_icon?: string;
  /** Icona della finestra dell'applicazione. */
  window_icon?: string;

  // --- Dimensioni e Layout della finestra ---
  /** Larghezza iniziale della finestra in pixel. */
  window_width?: number;
  /** Altezza iniziale della finestra in pixel. */
  window_height?: number;
  /** Se `true`, posiziona la barra laterale a sinistra (default), altrimenti a destra. */
  sidebar_on_left?: boolean;

  // --- Slideshow ---
  /**
   * L'API da usare per lo slideshow. 'qml' per le slideshow tradizionali,
   * 'contextual' per quelle basate sul modulo in esecuzione.
   */
  slideshow_api?: 'qml' | 'contextual';
  /** Percorso al file QML principale dello slideshow (se slideshow_api è 'qml'). */
  slideshow_qml_path?: string;
}