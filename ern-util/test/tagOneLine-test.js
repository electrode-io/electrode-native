import tagOneLine from '../src/tagoneline';
import {expect} from 'chai';

describe('tagOneLine', function () {

    it('should use a template tag', function () {
        const world = 'world';
        expect(tagOneLine`hello ${world}`).to.eql('hello world');
    })
});