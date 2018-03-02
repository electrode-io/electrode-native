package com.walmartlabs.ern.container.plugins;

import android.app.Application;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.facebook.react.ReactPackage;

public interface ReactPlugin<T extends ReactPluginConfig> {
    ReactPackage hook(@NonNull Application application, @Nullable T config);
}
