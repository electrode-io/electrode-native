package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;

import com.facebook.react.ReactInstanceManager;
import com.github.aoriani.rnstacktracer.StackTracePackage;

public class StackTracerPlugin {

    public void hook(@NonNull Application application,
                     @NonNull ReactInstanceManager.Builder reactInstanceManagerBuilder,
                     @NonNull Config config) {
        if (config.isEnabled) {
            reactInstanceManagerBuilder.addPackage(new StackTracePackage());
        }
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
