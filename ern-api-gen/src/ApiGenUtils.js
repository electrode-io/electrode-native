import  CodegenConfigurator from './config/CodegenConfigurator'
import  DefaultGenerator  from './DefaultGenerator'

export default class ApiGenUtils {
  /**
   * Util method to extract all requests from a given swagger schema json file.
   */
  static async extractApiEventsAndRequests (swaggerSchemaFile: string) {
    try {
      const config = {
        'inputSpec': swaggerSchemaFile,
        'lang': 'ERNAndroid', // Using android as a reference language, apiName, requests and responses will be same for all the langs.
        'outputDir': 'fake'
      }
      const cc = new CodegenConfigurator(config)
      const opts = await cc.toClientOptInput()
      const generator = new DefaultGenerator().opts(opts)
      const apis = generator.processPaths(generator.swagger.getPaths())['value']

      let result = []
      for (const apiKey in apis) {
        if (apis.hasOwnProperty(apiKey)) {
          const {requests, events} = ApiGenUtils.generateApiEventsAndRequestNames(apis[apiKey])
          result.push({'apiName': apiKey, requests, events})
        }
      }
      return result
    } catch (e) {
      throw new Error(`Unable to extract the apis: ${e}`)
    }
  }

  static generateApiEventsAndRequestNames (api: Object): Array<Object> {
    let requests = []
    let events = []
    for (const key in api) {
      if (api.hasOwnProperty(key) && api[key].httpMethod === `EVENT`) {
        events.push(api[key].camelizedNickName)
      } else {
        requests.push(api[key].camelizedNickName)
      }
    }
    return {requests, events}
  }
}