/**
 * ./src/appimage/first-run-check.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { DependencyManager } from "./dependency-manager.js";


const depsManager = new DependencyManager()
if (!depsManager.isInstalled()) {
   console.log('WARNING: You need to setup penguins-eggs for full functionality.');
   console.log('Run: sudo eggs setup');
}
