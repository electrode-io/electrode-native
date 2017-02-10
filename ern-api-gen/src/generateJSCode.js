import shell from 'shelljs';
import log from './log';
import {mustacheRenderToOutputFileUsingTemplateFile} from './renderer';


/**
 * Generate all JS code
 * view : The mustache view to use
 */
export default async function generateJSCode(view, apiGenDir) {
    shell.mkdir('-p', 'js');

    log.info(`Generating js/apiClient.js`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/js/apiClient.js.mustache`,
        view,
        `js/apiClient.js`);

    log.info(`Generating js/api.js`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/js/api.js.mustache`,
        view,
        `js/api.js`);

    log.info(`Generating js/messages.js`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/js/messages.js.mustache`,
        view,
        `js/messages.js`);

}
