/* tslint:disable:variable-name */
import AndroidClientCodegen from '../languages/AndroidClientCodegen';
import ernify from './ERNMixin';
import { newHashMap } from '../java/javaUtil';

export default class ErnAndroidApiCodegen extends AndroidClientCodegen {
  public sourceFolder = 'lib/src/main/java';
  public platformVersion = '1.3.0';
  public library = 'ern';
  public __supportedLibraries = newHashMap([
    'ern',
    'ERN plugin makes this platform work',
  ]);

  public addSupportingFilesForErn() {
    this.__apiTemplateFiles.put('apirequests.mustache', '.java');
    this.__apiTemplateFiles.put('apievents.mustache', '.java');
    this.__apiDataTemplateFile.put('apidatamodel.mustache', '.java');
  }

  public getName() {
    return 'ERNAndroid';
  }
}

ernify(ErnAndroidApiCodegen);
