import Swagger from '../src/java/Swagger';
import path from 'path';
import {expect} from 'chai';


describe('Swagger', function () {

    it('should create', async function () {
        const swagger = await Swagger.create({definition: path.join(__dirname, 'fixtures', 'uber.json')})

        const info = swagger.getInfo();


        const definitions = swagger.getDefinitions();

        const activities = definitions.get("Activities");



        const history = activities.getProperties().get("history");

        const items = history.getItems();

        expect(items.get$ref()).to.eql('#/definitions/Activity');
        expect(info).to.exist;

    });

});