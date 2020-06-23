{{#isOldRunner}}
package com.walmartlabs.ern;
{{/isOldRunner}}
{{^isOldRunner}}
package com.walmartlabs.ern.{{{lowerCaseMiniAppName}}};
{{/isOldRunner}}

import com.walmartlabs.ern.container.miniapps.{{{pascalCaseMiniAppName}}}Activity;

//
// GENERATED CODE: DO NOT MODIFY
//
// Do not modify the content of this file as it will be regenerated
// every time a run-android command is executed.
// See https://native.electrode.io/cli-commands/run-android

final class RunnerConfig {
    static final Class MAIN_MINIAPP_ACTIVITY_CLASS = {{{pascalCaseMiniAppName}}}Activity.class;
    static final boolean RN_DEV_SUPPORT_ENABLED = {{{isReactNativeDevSupportEnabled}}};
    static final String PACKAGER_HOST = "{{{packagerHost}}}";
    static final String PACKAGER_PORT = "{{{packagerPort}}}";
}
