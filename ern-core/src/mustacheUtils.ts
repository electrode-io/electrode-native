import Mustache from 'mustache';
import fs from 'fs-extra';

// =============================================================================
// Mustache related utilities
// =============================================================================

// Mustache render using a template file
// filename: Path to the template file
// view: Mustache view to apply to the template
// returns: Rendered string output
export async function mustacheRenderUsingTemplateFile(
  filename: string,
  view: any,
  partials?: any,
) {
  return fs
    .readFile(filename, 'utf8')
    .then(template => Mustache.render(template, view, partials));
}

// Mustache render to an output file using a template file
// templateFilename: Path to the template file
// view: Mustache view to apply to the template
// outputFile: Path to the output file
export async function mustacheRenderToOutputFileUsingTemplateFile(
  templateFilename: string,
  view: any,
  outputFile: string,
  partials?: any,
) {
  return mustacheRenderUsingTemplateFile(templateFilename, view, partials).then(
    output => {
      return fs.writeFile(outputFile, output);
    },
  );
}
