package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.microsoft.codepush.react.CodePush;

public class CodePushPlugin {

    public ReactPackage hook(@NonNull Application application ,
                     @NonNull ReactInstanceManager.Builder reactInstanceManagerBuilder,
                     @NonNull Config config) {
        CodePush codePush = null;
        if (null != config.serverUrl) {
            codePush = new CodePush(
                          config.deploymentKey,
                          application,
                          config.isDebugModeEnabled,
                          config.serverUrl);
        } else {
            codePush = new CodePush(
                          config.deploymentKey,
                          application,
                          config.isDebugModeEnabled);
        }

        reactInstanceManagerBuilder
                .setJSBundleFile(CodePush.getJSBundleFile())
                .addPackage(codePush);

        return codePush;
    }

    public static class Config {
        private final String deploymentKey;
        private String serverUrl;
        private boolean isDebugModeEnabled;

        public Config(@NonNull String deploymentKey) {
            this.deploymentKey = deploymentKey;
        }

        public Config serverUrl(String serverUrl) {
            this.serverUrl = serverUrl;
            return this;
        }

        public Config enableDebugMode(boolean isEnabled) {
            this.isDebugModeEnabled = isEnabled;
            return this;
        }
    }
}
