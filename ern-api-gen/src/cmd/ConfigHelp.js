import CodegenConfigLoader from '../CodegenConfigLoader';
import {Command} from '../java/cli';

export default class ConfigHelp {
    static Usage = new Command({name: "config-help", description: "Config help for chosen lang"}, [
        {
            name: ["-l", "--lang"], title: "language", required: true, hasArg: true,
            description: "language to get config help for"
        }
    ]);

    constructor({language}) {
        this.language = language;
    }

    run() {
        let config = CodegenConfigLoader.forName(this.language);
        console.info("CONFIG OPTIONS");

        for (const langCliOption of config.cliOptions()) {
            {
                console.info("\t" + langCliOption.getOpt());
                console.info("\t    " + langCliOption.getOptionHelp().replace(new RegExp("\n", 'g'), "\n\t    "));
                console.info();
            }
        }
    }
}
