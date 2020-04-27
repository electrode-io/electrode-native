import ServiceLoader from '../java/ServiceLoader';
import { Command } from '../java/cli';

export default class Langs {
  public static Usage = new Command(
    { name: 'langs', description: 'Shows available langs' },
    [{ name: ['-h', '--help'], title: 'help', description: 'verbose mode' }],
  );

  public static configs() {
    return ServiceLoader.load('io.swagger.codegen.CodegenConfig');
  }

  public static langs() {
    return Langs.configs().map(v => v.getName());
  }

  public run() {
    return 'Available languages: ' + Langs.langs();
  }
}
