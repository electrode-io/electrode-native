import Mustache from 'mustache';
import log from './log';
import {readFile, writeFile} from './fileUtil';
import readDir from 'fs-readdir-recursive';

const ignoreRe = /node_modules\/|jar$/;

const ignore = (file) => !ignoreRe.test(file);

export async function patchHull(view) {
    const files = readDir(view.outFolder).filter(ignore);
    // Mustache render all files (even those not containing inline templates
    // for the sake of simplicity)
    for (const file of files) {
        await mustacheRenderToOutputFileUsingTemplateFile(
            `${view.outFolder}/${file}`,
            view,
            `${view.outFolder}/${file}`);
    }

}
export async function mustacheRenderUsingTemplateFile(tmplPath, view) {
    const template = await readFile(tmplPath, 'utf-8');
    try {
        return Mustache.render(template, view);
    } catch (e) {
        log.warn(`error rendering ${tmplPath}`, e.message);
        throw e;
    }
}
// Mustache render to an output file using a template file and a view
// tmplPath: Path to the template file
// view: Mustache view to apply to the template
// outPath: Path to the output file
export async function mustacheRenderToOutputFileUsingTemplateFile(tmplPath, view, outPath) {
    const output = await mustacheRenderUsingTemplateFile(tmplPath, view);
    return writeFile(outPath, output);
}
