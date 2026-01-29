import { select } from '@inquirer/prompts'

import { shx } from '../../lib/utils.js'

export default async function selectInstallationDevice(): Promise<string> {
  const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
  const raid = shx.exec('lsblk -l | grep raid | cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
  const driveList: { name: string, value: string }[] = []

  // Add drives to driveList
  drives.forEach((element: string) => {
    if (!element.includes('zram') && element !== '') {
      driveList.push({ name: '/dev/' + element, value: '/dev/' + element })
    }
  })

  // Add raid to driveList
  raid.forEach((element: string) => {
    if (!element.includes('zram') && element !== '') {
      driveList.push({ name: '/dev/' + element, value: '/dev/' + element })
    }
  })

  const answer = await select({
    message: 'Select the installation disk: ',
    choices: driveList,
  });

  return answer;
}
