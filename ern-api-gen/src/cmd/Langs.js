import ServiceLoader from "../java/ServiceLoader";
import {Command} from '../java/cli';
export default class Langs {

    static configs() {
        return ServiceLoader.load("io.swagger.codegen.CodegenConfig");
    }

    static langs() {
        return Langs.configs().map(v => v.getName())
    }

    static Usage = new Command({name: "langs", description: "Shows available langs"}, [
        {name: ["-h", "--help"], title: "help", description: "verbose mode"}
    ]);


    run() {
        return "Available languages: " + Langs.langs();
    }
}
