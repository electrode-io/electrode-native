import { generateApiImpl } from '../src/index'
import {
  coloredLog
} from '@walmart/ern-util'
global.log = coloredLog

describe('run ApiImpl generator command', () => {
  it('should create impl prject dirs', (done) => {
    generateApiImpl({api: 'react-native-movie-api', nativeOnly: true, forceGenerate: true}, (result) => {
      if (result) {
        done()
      } else {
        done('error')
      }
    })
  }).timeout(20000)
})
