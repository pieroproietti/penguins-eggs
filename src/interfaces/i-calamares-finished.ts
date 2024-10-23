/**
 * ./src/interfaces/i-calamares-finished.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresFinished {
    restartNowMode: 'never' | 'user-unchecked' | 'user-checked' | 'always'
    restartNowCommand?: string
    notifyOnFinished: boolean
}
