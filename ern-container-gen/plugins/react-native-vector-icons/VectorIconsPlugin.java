package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;

import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactPackage;
import com.oblador.vectoricons.VectorIconsPackage;

public class VectorIconsPlugin {

    public ReactPackage hook(@NonNull Application application,
                     @NonNull ReactInstanceManagerBuilder reactInstanceManagerBuilder) {
        VectorIconsPackage vectorIconsPackage = new VectorIconsPackage();
        reactInstanceManagerBuilder.addPackage(vectorIconsPackage);
        return vectorIconsPackage;
    }
}
