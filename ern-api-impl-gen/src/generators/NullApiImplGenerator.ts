import { PackagePath, log } from 'ern-core'
import { ApiImplGeneratable } from '../ApiImplGeneratable'

export default class NullApiImplGenerator implements ApiImplGeneratable {
  get name(): string {
    return 'NullApiImplGenerator'
  }

  public async generate(
    apiDependency: PackagePath,
    paths: any,
    reactNativeVersion: string,
    plugins: PackagePath[],
    apis: PackagePath[],
    regen: boolean
  ) {
    log.debug('NullApiImplGenerator generate - noop')
  }
}
