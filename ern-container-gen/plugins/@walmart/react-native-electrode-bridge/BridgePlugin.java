package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;

import com.facebook.react.ReactInstanceManager;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgePackage;

public class BridgePlugin {

    public void hook(@NonNull Application application,
                     @NonNull ReactInstanceManager.Builder reactInstanceManagerBuilder) {
      reactInstanceManagerBuilder.addPackage(new ElectrodeBridgePackage());
    }

}
