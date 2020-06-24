import { availableUserConfigKeys } from 'ern-orchestrator';

export const platformSupportedConfigAsString = () =>
  'Electrode Native Supports following keys :\n' +
  availableUserConfigKeys
    .map(
      (e) =>
        `${e.name.padEnd(15)} : ${e.desc.padEnd(60)}  [${e.values.join('|')}]`,
    )
    .join('\n') +
  '\n\n';
