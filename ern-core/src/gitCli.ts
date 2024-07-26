import simpleGit from 'simple-git';

export function gitCli(workingDir?: string) {
  const sGit = simpleGit(workingDir);

  if (process.env.ERN_GITHUB_TOKEN) {
    sGit.addConfig(
      'http.extraheader',
      `Authorization: Basic ${process.env.ERN_GITHUB_TOKEN}`,
    );
  }

  return sGit;
}
