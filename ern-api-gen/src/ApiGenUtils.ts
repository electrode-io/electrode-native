import CodegenConfigurator from './config/CodegenConfigurator'
import DefaultGenerator from './DefaultGenerator'

export default class ApiGenUtils {
  /**
   * Util method to extract all requests from a given swagger schema json file.
   */
  public static async extractApiEventsAndRequests(swaggerSchemaFile: string) {
    try {
      const config = {
        inputSpec: swaggerSchemaFile,
        lang: 'ERNAndroid', // Using android as a reference language, apiName, requests and responses will be same for all the langs.
        outputDir: 'fake',
      }
      const cc = new CodegenConfigurator(config)
      const opts = await cc.toClientOptInput()
      const generator = new DefaultGenerator().opts(opts)
      const apis = generator.processPaths(generator.swagger.getPaths()).value

      const result: Array<{
        apiName: string
        requests: string[]
        events: string[]
      }> = []
      for (const apiKey in apis) {
        if (apis.hasOwnProperty(apiKey)) {
          const {
            requests,
            events,
          } = ApiGenUtils.generateApiEventsAndRequestNames(apis[apiKey])
          result.push({ apiName: apiKey, requests, events })
        }
      }
      return result
    } catch (e) {
      throw new Error(`Unable to extract the apis: ${e}`)
    }
  }

  public static generateApiEventsAndRequestNames(
    api: any
  ): { requests: string[]; events: string[] } {
    const requests: string[] = []
    const events: string[] = []
    for (const key in api) {
      if (api.hasOwnProperty(key) && api[key].httpMethod === `EVENT`) {
        events.push(api[key].camelizedNickName)
      } else {
        requests.push(api[key].camelizedNickName)
      }
    }
    return { requests, events }
  }
}
