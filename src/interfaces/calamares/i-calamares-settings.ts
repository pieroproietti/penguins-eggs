/**
 * ./src/interfaces/i-calamares-settings.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ISettings {
  /**
   * Il nome della cartella di branding da utilizzare, situata in /etc/calamares/branding/.
   */
  branding: string

  /**
   * Controlla se la finestra può essere chiusa durante l'installazione.
   * `true` permette la chiusura, `false` la impedisce.
   */
  'enable-close-button-during-install'?: boolean

  /**
   * Se impostato a `true`, chiede una conferma all'utente prima di avviare
   * la fase di installazione vera e propria.
   */
  'prompt-install'?: boolean

  /**
   * La sequenza principale dei moduli da eseguire. È un array di oggetti,
   * dove ogni oggetto rappresenta una fase (es. 'show', 'exec') e contiene
   * una lista di nomi di moduli da caricare in quella fase.
   */
  sequence: { [phase: string]: string[] }[]

  /**
   * Controlla la visibilità della barra laterale sinistra che elenca i passaggi
   * dell'installazione.
   */
  'show-sidebar'?: boolean
}
