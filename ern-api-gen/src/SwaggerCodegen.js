import ConfigHelp from './cmd/ConfigHelp'
import Generate from './cmd/Generate'
import Langs from './cmd/Langs'
import Meta from './cmd/Meta'
import { Cli, Help } from './java/cli'
/**
 * User: lanwen
 * Date: 24.03.15
 * Time: 17:56
 * <p>
 * Command line interface for swagger codegen
 * use `swagger-codegen-cli.jar help` for more info
 *
 * @since 2.1.3-M1
 */
export default class SwaggerCodegen {
  static async main(args) {
    return Cli.builder('swagger-codegen-cli')
      .withDescription('Swagger code generator CLI. More info on swagger.io')
      .withDefaultCommand(Langs)
      .withCommands(Generate, Meta, Langs, Help, ConfigHelp)
      .build()
      .parse(args)
  }
}
if (require.main === module) {
  SwaggerCodegen.main(process.argv.slice(2)).then(console.log, err => {
    console.error(err.message)
    process.exit(1)
  })
}
