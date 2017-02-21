import {config} from '../src';
import {expect} from 'chai';

describe('config', function () {
    it('should load config', () => {
        expect(config.obj).to.eql({
                "cauldronUrl": "http://localhost:3000",
                "libgen": {
                    "android": {
                        "generator": {
                            "name": "maven",
                            "platform": "android"
                        }
                    }
                },
                "platformVersion": "1000"
            }
        )
    })
});
