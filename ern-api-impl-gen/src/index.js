// @flow

import _generateApiImpl from './ApiImpl'
import _regenerateApiImpl from './ApiImplRegen'

export const generateApiImpl = _generateApiImpl
export const regenerateApiImpl = _regenerateApiImpl

export default ({
  generateApiImpl: _generateApiImpl,
  regenerateApiImpl: _regenerateApiImpl
})
