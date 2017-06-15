import { generateApiImpl } from '../src/index'

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
