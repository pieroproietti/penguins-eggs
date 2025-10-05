/**
 * ./src/interfaces/i-calamares-finished.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresFinished {
  restartNowEnabled?: boolean;
  restartNowChecked?: boolean;
  restartNowCommand?: string;
  restartNowMode?: "never" | "user-unchecked" | "user-checked" | "always";
  notifyOnFinished?: boolean;
}
