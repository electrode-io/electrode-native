import {
  assert
} from 'chai'
import ernSupport from '@walmart/ern-util-dev'

describe('commands/platform', function () {
  this.timeout(100000)

  const {
        runBefore,
        runAfter,
        ernTest,
        fail
    } = ernSupport(__dirname)

  before(runBefore)
  after(runAfter)

  it(`platform`, ernTest().then(fail, err => {
    assert(/platform needs a command/.test(err.message), `has a command`)
  }))
})
