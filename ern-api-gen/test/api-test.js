import DefaultGenerator from '../src/DefaultGenerator'
import path from 'path'
import { shell } from 'ern-core'
import ernUtilDev from 'ern-util-dev'
import File from '../src/java/File'
import { execSync } from 'child_process'
import CodegenConfigurator from '../src/config/CodegenConfigurator'
import Langs from '../src/cmd/Langs'
import fs from 'fs'
import { expect } from 'chai'

describe('api schemas', async function() {
  this.timeout(50000)

  const { compare, runBefore, cwd, runAfter } = ernUtilDev(__dirname, true)

  before(runBefore)
  after(runAfter)

  function generate(inputSpec, lang, outputDir, extra = {}) {
    return generateObj({
      inputSpec,
      lang,
      outputDir,
      ...extra,
    })
  }

  const generateObj = async function(config) {
    const outputDir = cwd(config.outputDir)
    const tmpFile = new File(outputDir)
    if (tmpFile.exists()) {
      shell.rm('-rf', tmpFile)
    }

    tmpFile.mkdirs()
    config.inputSpec = path.join(__dirname, 'fixtures', config.inputSpec)
    config.outputDir = outputDir
    config.bridgeVersion = '1.0.0'
    config.apiPackage = 'com.ern.test'
    const cc = new CodegenConfigurator(config)

    const opts = await cc.toClientOptInput()
    const d = new DefaultGenerator().opts(opts)
    return d.generate()
  }

  function npm(command, dir) {
    return function() {
      return execSync(`npm ${command}`, {
        cwd: cwd(dir),
        stdio: [process.stdin, process.stdout, process.stderr],
      })
    }
  }

  const specs = fs
    .readdirSync(path.join(__dirname, 'fixtures', 'apis'))
    .filter(basename => !basename.match(/invalid/))
  const invalidSpecsByName = {
    emptyProperty: 'empty-property.json',
  }
  const langs = Langs.langs()
  for (const lang of langs) {
    describe(lang, function() {
      for (const inputSpec of specs) {
        it(`apis should generate '${inputSpec}' for '${lang}'`, async () => {
          const api = await generateObj({
            inputSpec: `apis/${inputSpec}`,
            lang,
            outputDir: `apis/${inputSpec.replace(/\./, '_')}/${lang}`,
          })
          expect(api).to.have.length.greaterThan(0)
        })
      }
      // manually exec invalid api expecations
      it(`apis shouldn't generate 'empty-property' for '${lang}'`, () =>
        generateObj({
          inputSpec: `apis/invalid/${invalidSpecsByName.emptyProperty}`,
          lang,
          outputDir: `apis/invalid/${invalidSpecsByName.emptyProperty.replace(
            /\./,
            '_'
          )}/${lang}`,
        })
          .then(api => expect(api).to.not.exist)
          .catch(err => {
            expect(err.message.match(/Empty/))
            expect(err.message.match(/Try inspecting/))
          }))
    })
  }
  /* it(`should generate 'analytics.json' for 'ES6ERN'`, generateObj({
      inputSpec: `apis/analytics.json`,
      lang: 'ERNES6',
      outputDir: `analytics_json`
  })); */
})
