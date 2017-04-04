import {
    applySystemPropertiesKvp,
    applyInstantiationTypesKvp,
    applyImportMappingsKvp,
    applyTypeMappingsKvp,
    applyAdditionalPropertiesKvp,
    applyLanguageSpecificPrimitivesCsv
} from '../src/config/CodegenConfiguratorUtils';
import CodegenConfigurator from '../src/config/CodegenConfigurator';
import {expect} from 'chai';
describe('CodegenConfiguratorUtils', function () {
    let config;
    beforeEach(() => config = new CodegenConfigurator());

    it('should applySystemPropertiesKvp', function () {
        applySystemPropertiesKvp("test=1,other=2", config);
        const map = config.getSystemProperties();
        expect(map.get("test")).to.eq("1");
        expect(map.get("other")).to.eq("2");
    });
    it('should applyInstantiationTypesKvp', function () {
        applyInstantiationTypesKvp("test=0,test=1,other=2", config);
        const map = config.getInstantiationTypes();
        expect(map.get("test")).to.eq("1");
        expect(map.get("other")).to.eq("2");

    });
    it('should applyImportMappingsKvp', function () {
        applyImportMappingsKvp("test=0,test=1,other=2", config);
        const map = config.getImportMappings();
        expect(map.get("test")).to.eq("1");
        expect(map.get("other")).to.eq("2");

    });
    it('should applyTypeMappingsKvp', function () {

        applyTypeMappingsKvp("test=0,test=1,other=2", config);
        const map = config.getTypeMappings();
        expect(map.get("test")).to.eq("1");
        expect(map.get("other")).to.eq("2");
    });
    it('should applyAdditionalPropertiesKvp', function () {
        applyAdditionalPropertiesKvp("test=0,test=1,other=2", config);
        const map = config.getAdditionalProperties();
        expect(map.get("test")).to.eq("1");
        expect(map.get("other")).to.eq("2");

    });
    it('should applyLanguageSpecificPrimitivesCsv', function () {
        applyLanguageSpecificPrimitivesCsv("a,b,c", config);
        const map = config.getLanguageSpecificPrimitives();
        expect(map.toArray()).to.eql(['a', 'b', 'c']);
    });

});
