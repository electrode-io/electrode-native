import shell from 'shelljs';
import log from './log';
import xcode from 'xcode';
import {mustacheRenderToOutputFileUsingTemplateFile} from './renderer';
import findKey from 'lodash/findKey';
import fs from 'fs';

/**
 *  Generate Objective-C code
 *   view : The mustache view to use
 */
export default async function generateObjectiveCCode(view, apiGenDir) {
    const objCOutputPath = view.objCDest || 'output/objc';
    shell.mkdir('-p', objCOutputPath);

    const headerFiles = [
        `${view.pascalCaseApiName}Api.h`,
        `${view.pascalCaseApiName}ApiClient.h`,
        'Names.h'
    ];

    const sourceFiles = [
        `${view.pascalCaseApiName}Api.m`,
        `${view.pascalCaseApiName}ApiClient.m`,
        'Names.m'
    ];

    log.info(`Generating ${objCOutputPath}/API/${view.pascalCaseApiName}Api.h`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/Api.h.mustache`,
        view,
        `${objCOutputPath}/API/${headerFiles[0]}`);

    log.info(`Generating ${objCOutputPath}/API/${view.pascalCaseApiName}Api.m`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/Api.m.mustache`,
        view,
        `${objCOutputPath}/API/${sourceFiles[0]}`);

    log.info(`Generating ${objCOutputPath}/API/${view.pascalCaseApiName}ApiClient.h`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/ApiClient.h.mustache`,
        view,
        `${objCOutputPath}/API/${headerFiles[1]}`);

    log.info(`Generating ${objCOutputPath}/API/${view.pascalCaseApiName}ApiClient.m`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/ApiClient.m.mustache`,
        view,
        `${objCOutputPath}/API/${sourceFiles[1]}`);

    log.info(`Generating ${objCOutputPath}/API/Names.h`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/Names.h.mustache`,
        view,
        `${objCOutputPath}/API/${headerFiles[2]}`);

    log.info(`Generating ${objCOutputPath}/API/Names.m`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/Names.m.mustache`,
        view,
        `${objCOutputPath}/API/${sourceFiles[2]}`);

    const projectPath = `${objCOutputPath}/API.xcodeproj/project.pbxproj`;
    const xcodeProject = xcode.project(projectPath);

    xcodeProject.parse((error) => {
        if (error) {
            console.error(error);
            return;
        }
        const group = xcodeProject.pbxGroupByName('API');
        const groupKey = findKey(xcodeProject.hash.project.objects['PBXGroup'], group);
        headerFiles.forEach((h) => xcodeProject.addHeaderFile(h, {}, groupKey));
        sourceFiles.forEach((s) => xcodeProject.addSourceFile(s, {}, groupKey));
        fs.writeFileSync(projectPath, xcodeProject.writeSync());
    });
}
