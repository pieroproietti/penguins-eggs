/**
 * ./src/classes/daddy.ts
 * penguins-eggs v.25.7.x / ECMAScript 2020
 * author: Piero Proietti (modified by Hossein Seilani)
 * license: MIT
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import yaml from 'js-yaml';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from '../lib/utils.js';

import Pacman from '../classes/pacman.js';
import Settings from '../classes/settings.js';
import Utils from '../classes/utils.js';
import { IEggsConfig } from '../interfaces/i-eggs-config.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

interface EditConf {
  compression: string;
  root_passwd: string;
  snapshot_basename: string;
  snapshot_prefix: string;
  theme: string;
  user_opt: string;
  user_opt_passwd: string;
}

export default class Daddy {
  settings = {} as Settings;

  /**
   * [CHANGE 1] Modular, type-safe, interactive configuration editor
   * This method asks the user for LiveCD parameters using inquirer and returns
   * a fully typed IEggsConfig object. It replaces the older JSON.stringify/parse approach.
   */
  async editConfig(config: IEggsConfig): Promise<IEggsConfig> {
    console.log(chalk.cyan('Edit and save Live system parameters\n'));

    // Determine default compression option
    let compressionOpt: number;
    switch (config.compression) {
      case 'xz':
        compressionOpt = 1;
        break;
      case 'xz -Xbcj x86':
        compressionOpt = 2;
        break;
      default:
        compressionOpt = 0;
        break;
    }

    // Provide a default snapshot prefix if empty
    if (!config.snapshot_prefix) {
      config.snapshot_prefix = Utils.snapshotPrefix(
        this.settings.distro.distroId,
        this.settings.distro.codenameId
      );
    }

    /**
     *     // Define type-safe inquirer questions
     * const questions: inquirer.QuestionCollection<IEggsConfig> = [
     */
    const questions: any = [
    {
        type: 'input',
        name: 'snapshot_prefix',
        message: 'LiveCD iso prefix: ',
        default: config.snapshot_prefix,
      },
      {
        type: 'input',
        name: 'snapshot_basename',
        message: 'LiveCD iso basename: ',
        default: config.snapshot_basename,
      },
      {
        type: 'input',
        name: 'user_opt',
        message: 'LiveCD user:',
        default: config.user_opt,
      },
      {
        type: 'input',
        name: 'user_opt_passwd',
        message: 'LiveCD user password:',
        default: config.user_opt_passwd,
      },
      {
        type: 'input',
        name: 'root_passwd',
        message: 'LiveCD root password:',
        default: config.root_passwd,
      },
      {
        type: 'list',
        name: 'compression',
        message: 'LiveCD compression: ',
        choices: ['fast', 'max'],
        default: compressionOpt,
      },
    ];

    try {
      // Prompt the user and return the typed config object
      const answers = await inquirer.prompt<IEggsConfig>(questions);
      return answers;
    } catch (err) {
      console.error(chalk.red('Error editing configuration:'), err);
      throw err;
    }
  }

  /**
   * [CHANGE 2] Central method to manage environment, configuration and save
   * This method is modular, type-safe, and handles:
   * - Pacman and distro templates check
   * - Load, reset, or apply custom configuration
   * - Save configuration to disk
   * - Provide clear guidance to the user
   */
  async helpMe(
    reset = false,
    isCustom = false,
    fileCustom = '',
    verbose = false
  ): Promise<void> {
    try {
      if (isCustom) console.log('Using custom file:', fileCustom);

      // Step 1: Check system prerequisites
      await this.checkPacman(verbose);

      // Step 2: Load settings
      this.settings = new Settings();
      const loaded = await this.settings.load();
      let config: IEggsConfig = loaded ? this.settings.config : {} as IEggsConfig;

      // Step 3: Apply reset or custom configuration
      if (reset || isCustom) {
        await this.applyResetOrCustomConfig(config, isCustom, fileCustom);
      } else {
        config = await this.editConfig(config);
      }

      // Step 4: Save final configuration
      await this.settings.save(config);

      // Step 5: Display help messages
      this.displayFinalHelp();

    } catch (err) {
      console.error(chalk.red('An error occurred in helpMe:'), err);
    }
  }

  /**
   * Check and install Pacman configuration and templates if missing
   */
  private async checkPacman(verbose: boolean) {
    if (!Pacman.configurationCheck()) {
      console.log('- creating configuration directory...');
      await Pacman.configurationInstall(verbose);
    }
    if (!Pacman.distroTemplateCheck()) {
      console.log('- installing distro template...');
      await Pacman.distroTemplateInstall(verbose);
    }

    if (!Pacman.calamaresExists() && Pacman.isInstalledGui() && Pacman.isCalamaresAvailable()) {
      console.log('- GUI system detected, calamares is available but not installed.');
    }
  }

  /**
   * Apply reset or custom configuration
   */
  private async applyResetOrCustomConfig(
    config: IEggsConfig,
    isCustom: boolean,
    fileCustom: string
  ) {

    if (!config.snapshot_prefix) {
      /**
       * add fstype: btrfs, xfs, etc
       */
      // let fstype = '';
      // try {
      //   const { data } = await exec(`findmnt -n -o FSTYPE /`, { capture: true });
      //   fstype = data.trim() === 'ext4' ? '' : `${data.trim()}-`;
      // } catch (err) {
      //   console.warn('Unable to detect FSTYPE:', err);
      // }
      
      config.snapshot_prefix = Utils.snapshotPrefix(
        this.settings.distro.distroId,
        this.settings.distro.codenameId
      )
    }

    // Apply custom YAML if needed
    if (isCustom && fileCustom) {
      await this.applyCustomYAML(config, fileCustom);
    }
  }

  /**
   * Load and apply a custom YAML configuration
   * [CHANGE 3] Async reading of file and type-safe parsing
   */
  private async applyCustomYAML(config: IEggsConfig, fileCustom: string) {
    try {
      const conf = await fs.readFile(fileCustom, 'utf8');
      const confCustom = yaml.load(conf) as EditConf;

      // Safely copy fields from YAML to config
      config.snapshot_basename = confCustom.snapshot_basename ?? config.snapshot_basename;
      config.snapshot_prefix = confCustom.snapshot_prefix ?? config.snapshot_prefix;
      config.user_opt = confCustom.user_opt ?? config.user_opt;
      config.user_opt_passwd = confCustom.user_opt_passwd ?? config.user_opt_passwd;
      config.root_passwd = confCustom.root_passwd ?? config.root_passwd;
      config.theme = confCustom.theme ?? config.theme;

    } catch (err) {
      console.error(chalk.red('Failed to load custom YAML config:'), err);
      throw err;
    }
  }

  /**
   * Display final guidance and tips to the user
   * [CHANGE 4] Modular, clear, user-friendly messages
   */
  private displayFinalHelp() {
    console.log();
    console.log(chalk.cyan('Your configuration was saved on: /etc/penguins-eggs.d'));
    console.log(chalk.cyan('You can create a clean ISO with: ') + chalk.white('sudo eggs produce'));
    console.log(chalk.cyan('Or a full personal clone: ') + chalk.white('sudo eggs produce --clone'));
    console.log();
    console.log(chalk.cyan('If you don’t have enough space to remaster, you can mount remote or local space:'));
    console.log(chalk.cyan('- Create a hidden mountpoint under the nest:'));
    console.log(chalk.white('sudo mkdir /home/eggs/.mnt -p'));
    console.log(chalk.cyan('- Mount remote space:'));
    console.log(chalk.white('sudo sshfs -o allow_other root@192.168.1.2:/zfs/iso /home/eggs/.mnt'));
    console.log(chalk.cyan('- Or mount a local partition:'));
    console.log(chalk.white('sudo mount /dev/sdx1 /home/eggs/.mnt'));
    console.log();
    console.log(chalk.cyan('More help? ') + chalk.white('eggs mom'));
  }
}
