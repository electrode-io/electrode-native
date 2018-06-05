import { config, yarn } from 'ern-core'
import fs from 'fs'

// Such a long name. Seriously ?
// Rename !
export async function runAfterJsCompositeGenerationScript(outDir: string) {
  const customScript = config.getValue('custom-script')
  if (customScript) {
    if (!fs.existsSync(customScript)) {
      throw new Error(`custom-script was not found in ${customScript}`)
    }
    await require(customScript).afterJsCompositeGeneration({ outDir, yarn })
  }
}
