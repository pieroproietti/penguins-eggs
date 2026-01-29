import { select } from '@inquirer/prompts'

export default async function selectAddressType(): Promise<string> {
  const answer = await select({
    message: 'Select address type: ',
    choices: [
      { name: 'dhcp', value: 'dhcp' },
      { name: 'static', value: 'static' },
    ],
    default: 'dhcp',
  });
  return answer;
}
