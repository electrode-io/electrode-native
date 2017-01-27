package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.github.aoriani.rnstacktracer.StackTracePackage;

public class StackTracerPlugin {

    public ReactPackage hook(@NonNull Application application,
                     @NonNull ReactInstanceManager.Builder reactInstanceManagerBuilder,
                     @NonNull Config config) {
        StackTracePackage stackTracePackage = new StackTracePackage();
        if (config.isEnabled) {
            reactInstanceManagerBuilder.addPackage(stackTracePackage);
        }
        return stackTracePackage;
    }

    public static class Config {
        private boolean isEnabled;

        public Config() {
            isEnabled = true;
        }

        public Config enabled(boolean value) {
            this.isEnabled = value;
            return this;
        }
    }
}
