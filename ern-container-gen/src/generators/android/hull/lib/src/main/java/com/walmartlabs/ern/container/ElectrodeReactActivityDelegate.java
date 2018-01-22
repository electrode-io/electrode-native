/*
 * Copyright 2017 WalmartLabs
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.walmartlabs.ern.container;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.view.View;
import android.widget.Toast;

import com.facebook.react.ReactRootView;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;

import java.util.HashMap;
import java.util.Map;

/**
 * An instance of this class should be used by each Activity containing a ReactNative application.
 * It can be seen as the interaction surface with the ReactNative engine, providing a way to retrieve
 * the react native view containing a given ReactNative application, but also methods to call
 * to control the ReactNative lifecycle.
 */
public class ElectrodeReactActivityDelegate {

    public interface BackKeyHandler {
        void onBackKey();
    }


    /**
     * List of ReactRootView(s) holding the view containing the ReactNative application(s)
     */
    private Map<String, ReactRootView> mReactRootViews = new HashMap<>();

    /**
     * Back key handler specifics
     */
    private BackKeyHandler mBackKeyHandler;
    private DefaultHardwareBackBtnHandler mDefaultHardwareBackBtnHandler = new DefaultHardwareBackBtnHandler() {
        @Override
        public void invokeDefaultOnBackPressed() {
            if (mBackKeyHandler != null) {
                mBackKeyHandler.onBackKey();
            }
        }
    };

    /**
     * This method has to be called in your Activity onCreate. It retrieves the View containing
     * the ReactNative application
     *
     * @param activity        The activity attached to this delegate
     * @param applicationName The name of the ReactNative application to load
     * @param props           Any optional props to be passed to the ReactNative application upon start
     * @return A View instance containing the ReactNative application UI
     */
    @Nullable
    public View onCreate(@NonNull Activity activity, @NonNull String applicationName, @Nullable Bundle props) {
        //
        // Ask for overlay permission. This is required only during development and is needed for
        // ReactNative to display the Debug menu as an overlay
        if (ElectrodeReactContainer.getInstance().isReactNativeDeveloperSupport()
                && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !Settings.canDrawOverlays(activity)) {
            Intent serviceIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            serviceIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(serviceIntent);
            activity.finish();
            Toast.makeText(activity, "You must allow overlays first", Toast.LENGTH_SHORT).show();
            return null;
        } else {
            return getReactAppView(activity, applicationName, props);
        }
    }

    /**
     * Call this method from within your Activity onResume
     *
     * @param hostActivity The host activity
     */
    public void onResume(@NonNull Activity hostActivity) {
        ElectrodeReactContainer.getReactInstanceManager().onHostResume(hostActivity, mDefaultHardwareBackBtnHandler);
    }

    /**
     * Call this method from within your Activity onPause
     */
    public void onPause(@NonNull Activity activity) {
        ElectrodeReactContainer.getReactInstanceManager().onHostPause(activity);
    }

    /**
     * Call this method from within your Activity onDestroy
     */
    public void onDestroy(@NonNull Activity activity) {
        unMountReactApplications();

        if (ElectrodeReactContainer.hasReactInstance()) {
            ElectrodeReactContainer.getReactInstanceManager().onHostDestroy(activity);
        }
    }

    private void unMountReactApplications() {
        for (Map.Entry<String, ReactRootView> entry : mReactRootViews.entrySet()) {
            ReactRootView rootView = entry.getValue();
            rootView.unmountReactApplication();
        }
        mReactRootViews.clear();
    }

    /**
     * Call this method from within your Activity onBackPressed so that the ReactNative JS application
     * gets informed that the back button was pressed and handle this action internally.
     * If ReactNative JS application choose not to handle this back press, it will then be relayed
     * to the Native app, to the BackKeyHandler implementation that was passed to setBackKeyHandler
     */
    public void onBackPressed() {
        ElectrodeReactContainer.getReactInstanceManager().onBackPressed();
    }

    /**
     * Sets the BackKeyHandler instance to call whenever a back button press is not internally
     * handled/swallowed by the ReactNative JS application
     *
     * @param backKeyHandler A BackKeyHandler implementation
     */
    public void setBackKeyHandler(BackKeyHandler backKeyHandler) {
        mBackKeyHandler = backKeyHandler;
    }

    /**
     * Call this method from within your Activity onActivityResult
     */
    public boolean onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        ElectrodeReactContainer.getReactInstanceManager().onActivityResult(activity, requestCode, resultCode, data);
        return true;
    }

    /**
     * @return True if developer menu can be displayed (dev mode), false otherwise
     */
    public boolean canShowDeveloperMenu() {
        return ElectrodeReactContainer.getReactInstanceManager().getDevSupportManager().getDevSupportEnabled();
    }

    /**
     * Displays the react native developer menu
     */
    public void showDeveloperMenu() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            showDeveloperMenuMarshmallow();
        } else {
            ElectrodeReactContainer.getReactInstanceManager().getDevSupportManager().showDevOptionsDialog();
        }
    }

    @Nullable
    private View getReactAppView(@NonNull Activity activity, @NonNull String applicationName, @Nullable Bundle props) {
        ReactRootView rootView = mReactRootViews.get(applicationName);

        if (rootView == null) {
            rootView = new ReactRootView(activity);
            rootView.startReactApplication(ElectrodeReactContainer.getReactInstanceManager(), applicationName, props);
            mReactRootViews.put(applicationName, rootView);
        }

        return rootView;
    }

    @TargetApi(Build.VERSION_CODES.M)
    private void showDeveloperMenuMarshmallow() {
        if (Settings.canDrawOverlays(ElectrodeReactContainer.getReactInstanceManager().getCurrentReactContext())) {
            ElectrodeReactContainer.getReactInstanceManager().getDevSupportManager().showDevOptionsDialog();
        }
    }

    public void reload() {
        ElectrodeReactContainer.getReactInstanceManager().getDevSupportManager().handleReloadJS();
    }
}
