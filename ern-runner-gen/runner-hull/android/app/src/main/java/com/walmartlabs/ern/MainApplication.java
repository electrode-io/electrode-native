package com.walmartlabs.ern;

import android.app.Application;

import com.walmartlabs.ern.container.ElectrodeReactContainer;

public class MainApplication extends Application {

  @Override
  public void onCreate() {
    super.onCreate();

    ElectrodeReactContainer.initialize(
            this,
            new ElectrodeReactContainer.Config().isReactNativeDeveloperSupport(true)
            /* Add your additional plugins configuration here */);
  }

}
