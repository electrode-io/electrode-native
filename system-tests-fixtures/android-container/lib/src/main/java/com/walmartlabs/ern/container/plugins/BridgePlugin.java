package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;

import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactPackage;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgePackage;

public class BridgePlugin {

    public ReactPackage hook(@NonNull Application application,
                     @NonNull ReactInstanceManagerBuilder reactInstanceManagerBuilder) {
      ElectrodeBridgePackage electrodeBridgePackage = new ElectrodeBridgePackage();
      reactInstanceManagerBuilder.addPackage(electrodeBridgePackage);
      return electrodeBridgePackage;
    }

}
