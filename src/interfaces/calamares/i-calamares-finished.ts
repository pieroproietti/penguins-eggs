/**
 * ./src/interfaces/i-calamares-finished.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresFinished {
  notifyOnFinished?: boolean
  restartNowChecked?: boolean
  restartNowCommand?: string
  restartNowEnabled?: boolean
  restartNowMode?: 'always' | 'never' | 'user-checked' | 'user-unchecked'
}
