import { expect } from 'chai'
import sinon from 'sinon'
import inquirer from 'inquirer'
import { ModuleTypes } from 'ern-core'
import * as fixtures from './fixtures/common'
import { promptUserToUseSuffixModuleName } from '../src/lib/promptUserToUseSuffixModuleName'

describe('promptUserToUseSuffixModuleName', () => {
  const sandbox = sinon.createSandbox()

  let inquirerPromptStub: any

  beforeEach(() => {
    inquirerPromptStub = sandbox.stub(inquirer, 'prompt')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('return suffixed mini-app name if user confirms true', async () => {
    inquirerPromptStub.resolves({ useSuffixedModuleName: true })
    const result = await promptUserToUseSuffixModuleName(
      fixtures.npmPkgName,
      ModuleTypes.MINIAPP
    )
    expect(result).to.be.equal(`${fixtures.npmPkgName}MiniApp`)
  })

  it('return suffixed api name if user confirms true', async () => {
    inquirerPromptStub.resolves({ useSuffixedModuleName: true })
    const result = await promptUserToUseSuffixModuleName(
      fixtures.npmPkgName,
      ModuleTypes.API
    )
    expect(result).to.be.equal(`${fixtures.npmPkgName}Api`)
  })

  it('return suffixed (js) api-impl name if user confirms true', async () => {
    inquirerPromptStub.resolves({ useSuffixedModuleName: true })
    const result = await promptUserToUseSuffixModuleName(
      fixtures.npmPkgName,
      ModuleTypes.JS_API_IMPL
    )
    expect(result).to.be.equal(`${fixtures.npmPkgName}ApiImplJs`)
  })

  it('return suffixed (native) api-impl name if user confirms true', async () => {
    inquirerPromptStub.resolves({ useSuffixedModuleName: true })
    const result = await promptUserToUseSuffixModuleName(
      fixtures.npmPkgName,
      ModuleTypes.NATIVE_API_IMPL
    )
    expect(result).to.be.equal(`${fixtures.npmPkgName}ApiImplNative`)
  })

  it('return non-suffixed mini-app name if user selects false', async () => {
    inquirerPromptStub.resolves({ useSuffixedModuleName: false })
    const result = await promptUserToUseSuffixModuleName(
      fixtures.npmPkgName,
      ModuleTypes.MINIAPP
    )
    expect(result).to.be.equal(fixtures.npmPkgName)
  })

  it('return non-suffixed api name if user selects false', async () => {
    inquirerPromptStub.resolves({ useSuffixedModuleName: false })
    const result = await promptUserToUseSuffixModuleName(
      fixtures.npmPkgName,
      ModuleTypes.API
    )
    expect(result).to.be.equal(fixtures.npmPkgName)
  })

  it('return non-suffixed (js) api-impl name if user selects false', async () => {
    inquirerPromptStub.resolves({ useSuffixedModuleName: false })
    const result = await promptUserToUseSuffixModuleName(
      fixtures.npmPkgName,
      ModuleTypes.JS_API_IMPL
    )
    expect(result).to.be.equal(fixtures.npmPkgName)
  })

  it('return non-suffixed (native) api-impl name if user selects false', async () => {
    inquirerPromptStub.resolves({ useSuffixedModuleName: false })
    const result = await promptUserToUseSuffixModuleName(
      fixtures.npmPkgName,
      ModuleTypes.NATIVE_API_IMPL
    )
    expect(result).to.be.equal(fixtures.npmPkgName)
  })

  it('return non-suffixed (native) api-impl name if user selects false', async () => {
    try {
      await promptUserToUseSuffixModuleName(
        fixtures.npmPkgName,
        fixtures.moduleTypeNotSupported
      )
    } catch (e) {
      expect(e.message).to.include('Unsupported module type :')
    }
  })
})
