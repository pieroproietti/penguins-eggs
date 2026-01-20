import { expect } from 'chai';
import Settings from '../src/classes/settings.js';

describe('Settings Paths', () => {
    it('should resolve liveroot and iso paths correctly', async () => {
        const settings = new Settings();
        await settings.load();

        // Check if snapshot_dir is defined (it should be loaded from config)
        expect(settings.config.snapshot_dir).to.be.a('string');

        // Verify correct paths
        // work_dir.merged should be .../liveroot
        expect(settings.work_dir.merged).to.equal(settings.config.snapshot_dir + 'liveroot');

        // iso_work should be .../iso/
        expect(settings.iso_work).to.equal(settings.config.snapshot_dir + 'iso/');

        // efi_work should be .../tmp/efi/
        expect(settings.efi_work).to.equal(settings.config.snapshot_dir + 'tmp/efi/');

        // Also check that dotMnt logic in produce (which uses iso_work or similar) will rely on these correct settings.
        // We can't easily test private/protected members of Ovary without a more complex setup, 
        // but verifying Settings is the root cause fix.
    });
});
