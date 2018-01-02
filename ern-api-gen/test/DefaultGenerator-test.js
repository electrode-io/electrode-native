import DefaultGenerator from '../src/DefaultGenerator'
import path from 'path'
import {
  shell 
}from 'ern-core'
import ernUtilDev from 'ern-util-dev'
import {CONFIG} from '../src/java/Logger'
import File from '../src/java/File'
import {execSync} from 'child_process'
import CodegenConfigurator from '../src/config/CodegenConfigurator'
import Langs from '../src/cmd/Langs'

CONFIG.LEVEL = 0

describe('DefaultGenerator', function () {
  this.timeout(50000)

  const {compare, runBefore, cwd, runAfter} = ernUtilDev(__dirname, true)

  before(runBefore)
  after(runAfter)
  function generate (inputSpec, lang, outputDir, extra = {}) {
    return generateObj({inputSpec, lang, outputDir, ...extra})
  }

  const generateObj = function (config) {
    const thens = []
    const f = async function () {
      const outputDir = cwd(config.outputDir)
      const tmpFile = new File(outputDir)
      if (tmpFile.exists()) {
        shell.rm('-rf', tmpFile)
      }

      tmpFile.mkdirs()
      config.inputSpec = path.join(__dirname, 'fixtures', config.inputSpec)
      config.outputDir = outputDir
      config.bridgeVersion = '1.0.0'
      const cc = new CodegenConfigurator(config)

      const opts = await cc.toClientOptInput()
      const d = new DefaultGenerator().opts(opts)
      try {
        d.generate()
        for (const [success] of thens) {
          await success()
        }
      } catch (e) {
        console.trace(e)
        if (!thens || thens.length == 0) throw e
        for (const [s, fail] of thens) {
          if (fail) {
            fail(e)
          } else {
            throw e
          }
        }
      }
    }
    f.then = (...args) => {
      thens.push(args)
      return f
    }

    return f
  }

  function npm (command, dir) {
    return function () {
      return execSync(`npm ${command}`, {cwd: cwd(dir), stdio: [process.stdin, process.stdout, process.stderr]})
    }
  }

  it("should generate: 'uber.json' for 'android'", generateObj({
    inputSpec: 'uber.json',
    lang: 'android',
    outputDir: 'uber/android'
  })
        .then(compare('uber/android', 'fixtures/uber/android')))

  it("should generate: 'cookie.json' for 'ERNAndroid'", generate('cookie.json', 'ERNAndroid', 'erncookie/ERNAndroid'))

  it("should generate: 'petstore.json' for 'android'", generate('petstore.json', 'android', 'petstore/android')
        .then(compare('petstore/android', 'fixtures/petstore/android'))
    )

  //it("should generate: 'uber.json' for 'swift'", generate('uber.json', 'Swift', 'uber/swift')
  //      .then(compare('uber/swift', 'fixtures/uber/swift')))

  it("should generate: 'baseType.json' for 'ern-android'", generate('baseType.json', 'ERNAndroid', 'ern-android-baseType'))
  it("should generate: 'isListContainer.json' for 'ern-android'", generate('isListContainer.json', 'ERNAndroid', 'ern-android-isListContainer'))

  it("should generate: 'petstore.json' for 'ern-android'", generate('petstore.json', 'ERNAndroid', 'petstore/ern-android')
        //       .then(compare('petstore/ern-android', 'fixtures/petstore/ern-android'))
    )
  it("should generate: 'petstore.json' for 'ern-es6'", generate('petstore.json', 'ERNES6', 'petstore/ern-es6')
    //    .then(npm('install', 'petstore/ern-es6'))
    )

  it("should generate: 'petstore.json' for 'ern-es6-classy'", generate('petstore.json', 'ERNES6', 'petstore/ern-es6-classy', {'classy': true})
//        .then(compare('petstore/ern-es6', 'fixtures/petstore/ern-es6'))
    )

  it("should generate: 'petstore.json' for 'ern-swift'", generate('petstore.json', 'ERNSwift', 'petstore/ern-swift')
    )

  it("should generate: 'uber.json' for 'es6'", generate('uber.json', 'ES6', 'uber/es6')
    //    .then(npm('install', 'uber/es6'))
    )

  it("should generate: 'petstore.json' for 'es6'", generate('petstore.json', 'ES6', 'petstore/es6')
    //    .then(npm('install', 'petstore/es6'))
    )

  it("should generate: 'event.json' for 'Swift'", generate('event.json', 'Swift', 'event/swift'))

  describe('sanity test', function () {
    const specs = [
      'cookie.json',
      'petstore-expanded.json',
      'thing.json',
      'event.json',
      'api-with-examples.json',
      'petstore.json',
      'uber.json',
      'petstore.yaml'

    ]
    const langs = Langs.langs()
    for (const lang of langs) {
      describe(lang, function () {
        for (const inputSpec of specs) {
          it(`sanity check should generate '${inputSpec}' for '${lang}'`, generateObj({
            inputSpec,
            lang,
            outputDir: `sanity/${inputSpec.replace(/\./, '_')}/${lang}`
          }))
        }
      })
    }
  })
})
