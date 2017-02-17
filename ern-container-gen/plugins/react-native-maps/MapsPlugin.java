package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.airbnb.android.react.maps.MapsPackage;

public class MapsPlugin {

    public ReactPackage hook(@NonNull Application application,
                     @NonNull ReactInstanceManager.Builder reactInstanceManagerBuilder) {
        MapsPackage mapsPackage = new MapsPackage();
        reactInstanceManagerBuilder.addPackage(mapsPackage);
        return mapsPackage;
    }
}
