package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgePackage;

public class BridgePlugin {

    public ReactPackage hook(@NonNull Application application,
                     @NonNull ReactInstanceManager.Builder reactInstanceManagerBuilder) {
      ElectrodeBridgePackage electrodeBridgePackage = new ElectrodeBridgePackage();
      reactInstanceManagerBuilder.addPackage(electrodeBridgePackage);
      return electrodeBridgePackage;
    }

}
