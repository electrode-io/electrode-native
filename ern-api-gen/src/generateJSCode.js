import shell from 'shelljs';
import log from './log';
import {mustacheRenderToOutputFileUsingTemplateFile} from './renderer';


/**
 * Generate all JS code
 * view : The mustache view to use
 */
export default async function generateJSCode(view, apiGenDir) {
    const jsOutputPath = view.jsDest ? view.jsDest : 'output/js';
    shell.mkdir('-p', jsOutputPath);

    log.info(`Generating ${jsOutputPath}/apiClient.js`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/js/apiClient.js.mustache`,
        view,
        `${jsOutputPath}/apiClient.js`);

    log.info(`Generating ${jsOutputPath}/api.js`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/js/api.js.mustache`,
        view,
        `${jsOutputPath}/api.js`);

    log.info(`Generating ${jsOutputPath}/messages.js`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/js/messages.js.mustache`,
        view,
        `${jsOutputPath}/messages.js`);

}
