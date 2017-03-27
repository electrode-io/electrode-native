import {config} from '../src';
import {expect} from 'chai';

// 
// Configuration file will vary from users to users at the moment 
// until we implement mechanism to override default config in another file
// Even though, configuration will vary from users to users based on custom overrides
// This is therefore not a good test as it will break depending on the developer configuration
// What should be done is for the ErnConfig class to take path to configuration file and have
// a default being the path that will be used at runtime (the standard path to global config file)
// This way for test we can use a path that point to a config fixture that won't vary from 
// workstation to workstation

/*describe('config', function () {
    it('should load config', () => {
        expect(config.obj).to.eql({
                "cauldronUrl": "http://wm-cauldron.dev.walmart.com",
                "libgen": {
                    "android": {
                        "generator": {
                            "name": "maven",
                            "mavenRepositoryUrl": "http://mobilebuild.homeoffice.wal-mart.com:8081/nexus/content/repositories/hosted",
                            "platform": "android"
                        }
                    },
                    "ios": {
                        "generator": {
                            "name": "github",
                            "platform": "ios",
                            "targetRepoUrl": "https://gecgithub01.walmart.com/blemair/ios-container-test"
                        }
                    }
                },
                "platformVersion": "1000"
            }
        )
    })
});*/
