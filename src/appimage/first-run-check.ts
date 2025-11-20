/**
 * ./src/appimage/first-run-check.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Prerequisites } from './prerequisites.js';

const prerequisites = new Prerequisites();
if (!prerequisites.check()) {
   console.log('WARNING: System needs setup for full functionality.');
   console.log('Run: sudo eggs setup');
}