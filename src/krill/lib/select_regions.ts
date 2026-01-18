import { select } from '@inquirer/prompts'

export default async function selectRegions(selected = ''): Promise<string> {
  const choices = ['Atlantic', 'Africa', 'America', 'Antarctica', 'Artic', 'Australia', 'Europe', 'India', 'Europe', 'Pacific'].map(
    (region) => ({ name: region, value: region })
  );

  const answer = await select({
    message: 'Select your region: ',
    choices,
    default: selected,
  });

  return answer;
}
