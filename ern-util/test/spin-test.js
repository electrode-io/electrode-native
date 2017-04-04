import spin from '../src/spin';
import {expect} from 'chai';

describe('spin', function () {

    it('should spin', async() => {
        const res = await spin('hello', Promise.resolve(true));
        expect(res).to.be.true;
    });
    it('should fail', async() => {
        try {
            await spin('hello', Promise.reject('whatever'));
            expect(true).to.be.false;
        } catch (e) {
            expect(e).to.exist;
            return;
        }
        expect(false).to.be.true;
    });
});