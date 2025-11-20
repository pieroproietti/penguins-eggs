import { Prerequisites } from './prerequisites.js';

const prerequisites = new Prerequisites();
if (!prerequisites.check()) {
   console.log('WARNING: System needs setup for full functionality.');
   console.log('Run: sudo eggs setup');
}