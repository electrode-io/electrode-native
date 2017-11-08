import { expect } from 'chai'
import fs from 'fs'
import { promisify } from 'util'
import path from 'path'

import { parseIOSDevicesList } from '../src/ios.js'

const computerName = 'Funny MacBook Pro (47)\n'
const readFile = promisify(fs.readFile)

describe('ios utils', () => {
  describe('parse iOS device list', () => {
    it('should return empty list without device', async () => {
      const instruments = await readFile(
        path.resolve(__dirname, './fixtures/instruments.txt'),
        { encoding: 'utf8' }
      )
      expect(parseIOSDevicesList(instruments, computerName)).to.be.empty
    })
    it('should return item with device', async () => {
      const instrumentsWithDevice = await readFile(
        path.resolve(__dirname, './fixtures/instruments-with-device.txt'),
        { encoding: 'utf8' }
      )
      expect(
        parseIOSDevicesList(instrumentsWithDevice, computerName)
      ).to.deep.equal([{
        name: 'Hilarious Phone Name',
        udid: '695c329443f455c75b5454aacb72ace87b66351e',
        version: '11.1'
      }])
    })
  })
})
