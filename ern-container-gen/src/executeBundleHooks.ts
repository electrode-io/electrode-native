import fs from 'fs-extra';
import { getActiveCauldron } from 'ern-cauldron-api';
import path from 'path';
import shell from 'shelljs';
import tmp from 'tmp';

export async function executeBundleHooks(
  scriptPath: string,
  workingDirectory: string,
): Promise<number> {
  let pathToScript = scriptPath;
  if (pathToScript.startsWith('cauldron://')) {
    const localRepoPath = tmp.dirSync({ unsafeCleanup: true }).name;
    const cauldron = await getActiveCauldron({
      localRepoPath,
      throwIfNoActiveCauldron: false,
    });
    if (!cauldron) {
      throw new Error(`A Cauldron needs to be active to run ${pathToScript}`);
    } else if (!(await cauldron.hasFile({ cauldronFilePath: pathToScript }))) {
      throw new Error(`Cannot find ${pathToScript} in Cauldron`);
    }
    const scriptFile = await cauldron.getFile({
      cauldronFilePath: pathToScript,
    });
    const scriptFileName = path.basename(
      pathToScript.replace('cauldron://', ''),
    );
    const tmpScriptDir = tmp.dirSync({ unsafeCleanup: true }).name;
    pathToScript = path.join(tmpScriptDir, scriptFileName);
    fs.writeFileSync(pathToScript, scriptFile.toString());
    shell.chmod('+x', pathToScript);
  }
  const scriptResult = shell.exec(pathToScript, { cwd: workingDirectory });
  if (scriptResult.code !== 0) {
    throw new Error(`Script execution failed with code ${scriptResult.code}`);
  }
  return scriptResult.code;
}
