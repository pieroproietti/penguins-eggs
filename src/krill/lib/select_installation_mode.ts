import { select } from '@inquirer/prompts'

import { InstallationMode } from '../classes/krill_enums.js'

export default async function selectInstallationMode(): Promise<InstallationMode> {
  const modes = Object.values(InstallationMode)
  const choices = modes.map((mode) => ({ name: mode, value: mode }));

  const answer = await select({
    message: 'Select the installation mode: ',
    choices,
  });

  return answer as InstallationMode;
}
