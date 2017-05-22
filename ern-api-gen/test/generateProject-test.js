import gen from '../src/generateProject'
import ernUtilDev from '@walmart/ern-util-dev'
import normalizeConfig from '../src/normalizeConfig'

describe('generateProject', function () {
  const {runBefore, runAfter, cwd} = ernUtilDev(__dirname)
  beforeEach(runBefore)
  afterEach(runAfter)
  it('should generate blank', async() => {
    const normalized = normalizeConfig({
      name: '@whatever/react-native-hello-api',
      reactNativeVersion: '14.0.5',
      bridgeVersion: '1.2.3',
      apiVersion: '1.1.0'
    })

    await gen(normalized, cwd())
  })

  it('should generate with options', async() => {
    await gen(normalizeConfig({
      npmScope: 'walmart',
      name: 'hello',
      reactNativeVersion: '14.0.5',
      apiVersion: '1.1.0',
      apiDescription: 'Test',
      apiAuthor: 'test',
      apiLicense: 'ISC',
      bridgeVersion: '1.0.0'
    }), cwd())
  })
})
