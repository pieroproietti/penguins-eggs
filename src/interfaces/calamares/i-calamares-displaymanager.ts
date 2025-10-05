/**
 * ./src/interfaces/i-calamares-displaymanager.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresDisplaymanager {
  /**
   * @minItems 1
   */
  displaymanagers?: [
    "slim" | "sddm" | "lightdm" | "gdm" | "mdm" | "lxdm" | "greetd",
    ...("slim" | "sddm" | "lightdm" | "gdm" | "mdm" | "lxdm" | "greetd")[]
  ];
  defaultDesktopEnvironment?: {
    executable: string;
    desktopFile: string;
    [k: string]: unknown;
  };
  basicSetup?: boolean;
  sysconfigSetup?: boolean;
  greetd?: {
    greeter_user?: string;
    greeter_group?: string;
    greeter_css_location?: string;
  };
  lightdm?: {
    preferred_greeters?: string[];
  };
  sddm?: {
    configuration_file?: string;
  };
}
