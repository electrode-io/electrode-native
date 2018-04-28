import CodegenConfigurator from '../src/config/CodegenConfigurator'
import { expect } from 'chai'
import { newHashMap } from '../src/java/javaUtil'
import System from '../src/java/System'

describe('CodegenConfigurator', function() {
  it('should new', function() {
    const cc = new CodegenConfigurator()
    cc.setSystemProperties(newHashMap(['debugSwagger', 'true']))
    cc.addSystemProperty('whatveer', 'stf')
    cc.setSystemProperties()
    cc.setVerboseFlags()
    cc.setVerbose(true)
    cc.setVerboseFlags()
    const prop = cc.getSystemProperties()
    const result = prop.get('debugSwagger')
    expect(result).to.eql('true')
    cc.setVerbose(false)
    cc.setVerboseFlags()
    cc.setSystemProperties(newHashMap())
    cc.setSystemProperties()
    cc.addDynamicProperty('what', 'isthis')
    cc.getDynamicProperties().get('what')
    System.properties = {}
    expect(cc).to.exist
  })
  it('should new from missing config', function() {
    const brk = CodegenConfigurator.fromFile(
      `${__dirname}/fixtures/doesnotexist.json`
    )
    expect(brk).to.not.exist
  })
  it('should new from config', function() {
    const cc = CodegenConfigurator.fromFile(
      `${__dirname}/fixtures/codegen-conf.json`
    )
    expect(cc.verbose).to.be.true
    expect(cc.getDynamicProperties().get('what')).to.eql('is this')
  })
  it('should do something async (fail)', async () => {
    const cc = new CodegenConfigurator()
    try {
      const opt = await cc.toClientOptInput()
      expect(false).to.be.true
    } catch (e) {
      expect(e).to.be.an.instanceOf(Error)
    }
  })
  it('should do something async', async () => {
    const cc = new CodegenConfigurator()
    cc.setLang('android')
    cc.setHttpUserAgent('node/http')
    cc.setApiPackage('com.walmart')
    cc.setInputSpec(`${__dirname}/fixtures/petstore.json`)
    const opt = await cc.toClientOptInput()
    expect(opt).to.be.exist
  })
})
