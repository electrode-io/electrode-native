import parseApiSchema from '../lib/parseApiSchema';
import {expect} from 'chai';

function maketest(schema, match) {
    return () => {

        expect(parseApiSchema(schema)).to.eql(match);
    };
}
describe('parseApiSchema', function () {
    describe('meta: namespace|apiName|apiVersion|npmScope|modelPath', function () {
        it('should parse namespace', maketest(`namespace abc   `, {
            "events": [],
            "namespace": "abc",
            "requests": []
        }));
        it('should parse apiVersion', maketest(`apiVersion 1.0.0
//
namespace abc //this is a comment
`, {
            "events": [],
            "namespace": "abc",

            "apiVersion": "1.0.0",
            "requests": []
        }));


        it('should parse apiVersion amd apiName', maketest(`apiVersion 1.0.0
npmScope stuff
namespace abc //this is a comment
modelPath ../../.../stfuasd
`, {
            "events": [],
            "namespace": "abc",
            "npmScope": "stuff",
            "apiVersion": "1.0.0",
            "requests": [],
            "modelPath":"../../.../stfuasd"
        }));
    })
});