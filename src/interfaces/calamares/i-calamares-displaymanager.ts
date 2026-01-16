/**
 * ./src/interfaces/i-calamares-displaymanager.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresDisplaymanager {
  basicSetup?: boolean
  defaultDesktopEnvironment?: {
    [k: string]: unknown
    desktopFile: string
    executable: string
  }
  /**
   * @minItems 1
   */
  displaymanagers?: ['gdm' | 'greetd' | 'lightdm' | 'lxdm' | 'mdm' | 'sddm' | 'slim', ...('gdm' | 'greetd' | 'lightdm' | 'lxdm' | 'mdm' | 'sddm' | 'slim')[]]
  greetd?: {
    greeter_css_location?: string
    greeter_group?: string
    greeter_user?: string
  }
  lightdm?: {
    preferred_greeters?: string[]
  }
  sddm?: {
    configuration_file?: string
  }
  sysconfigSetup?: boolean
}
