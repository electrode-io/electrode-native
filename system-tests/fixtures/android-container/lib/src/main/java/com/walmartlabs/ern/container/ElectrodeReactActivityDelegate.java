package com.walmartlabs.ern.container;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.Callback;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionListener;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ElectrodeReactActivityDelegate extends ReactActivityDelegate {
    @Nullable
    private final Activity mCurrentActivity;

    /**
     * List of ReactRootView(s) holding the view containing the ReactNative application(s)
     */
    private final Map<String, ReactRootViewHolder> mReactRootViews = new HashMap<>();

    // NOTE: PermissionListener/callback part of the code is duplicated because of the class
    // casting done inside super.onResume to get the backKey handler implementation.
    @Nullable
    private PermissionListener mPermissionListener;
    @Nullable
    private Callback mPermissionsCallback;

    /**
     * Back key handler specifics
     */
    private BackKeyHandler mBackKeyHandler;

    private DefaultHardwareBackBtnHandler mDefaultHardwareBackBtnHandler =
            new DefaultHardwareBackBtnHandler() {
                @Override
                public void invokeDefaultOnBackPressed() {
                    if (mBackKeyHandler != null) {
                        mBackKeyHandler.onBackKey();
                    }
                }
            };

    /**
     * Call this constructor if you are having one activity hosting one react native application. If
     * you want your activity to host more than one react native application then call {@link
     * ElectrodeReactActivityDelegate#ElectrodeReactActivityDelegate(Activity)} and then invoke
     * {@link #onCreate(Activity, String, Bundle)} with different component names.
     *
     * @param activity
     * @param mainComponentName ReactNative component name.
     */
    public ElectrodeReactActivityDelegate(Activity activity, @Nullable String mainComponentName) {
        super(activity, mainComponentName);
        mCurrentActivity = activity;
    }

    public ElectrodeReactActivityDelegate(@NonNull Activity activity) {
        this(activity, null);
    }

    /**
     * This method has to be called in your Activity onCreate. It retrieves the View containing the
     * ReactNative application
     *
     * @param activity        The activity attached to this delegate
     * @param applicationName The name of the ReactNative application to load
     * @param props           Any optional props to be passed to the ReactNative application upon start
     * @return A View instance containing the ReactNative application UI
     * @deprecated call {@link #createMiniAppRootView(String, Bundle)} instead of this method
     */
    @Nullable
    @Deprecated
    public View onCreate(
            @NonNull Activity activity, @NonNull String applicationName, @Nullable Bundle props) {
        return createMiniAppRootView(applicationName, props);
    }

    /**
     * Call this method when you want to have more control over the react app views. For example:
     * you have an activity and would like to use the reactApp view as one of the view
     * component(partial screen) in your activities view. Or if you have an activity that is hosting
     * multiple fragments you can use this method to obtain view for your fragments.
     *
     * @param componentName name of the react native app view component.
     * @return View
     * @deprecated use {@link #createReactRootView(String, Bundle)}
     */
    @Deprecated
    public View createMiniAppRootView(@NonNull String componentName) {
        return createReactRootView(componentName, null, false);
    }

    /**
     * Call this method when you want to have more control over the react app views. For example:
     * you have an activity and would like to use the reactApp view as one of the view
     * component(partial screen) in your activities view. Or if you have an activity that is hosting
     * multiple fragments you can use this method to obtain view for your fragments.
     *
     * @param componentName name of the react native app component.
     * @return View
     * @deprecated use {@link #createReactRootView(String, Bundle)}. If you were relying on {@link
     * #createReactRootView(String, Bundle)} to update the props for an already existing
     * instance, please note that this functionality will be broken by moving to {@link
     * #createReactRootView(String, Bundle)}. To update the props on an existing view call
     * {@link ReactRootView#setAppProperties(Bundle)} on the instance that is returned by {@link
     * #createReactRootView(String, Bundle)}.
     */
    @Deprecated
    public View createMiniAppRootView(@NonNull String componentName, @Nullable Bundle props) {
        return createReactRootView(componentName, props, false);
    }

    /**
     * Creates a new instance of ReactRootView instance or the given component.
     *
     * @param componentName name of the react view component.
     * @param props         Props that will be passed to the component as initial props.
     * @return ReactRootView
     */
    public ReactRootView createReactRootView(
            @NonNull String componentName, @Nullable Bundle props) {
        return createReactRootView(componentName, props, true);
    }

    private ReactRootView createReactRootView(
            @NonNull String componentName, @Nullable Bundle props, boolean newInstance) {
        Bundle finalProps = getLaunchOptions();
        if (props != null) {
            if (finalProps != null) {
                finalProps.putAll(props);
            } else {
                finalProps = props;
            }
        }
        return getReactAppView(componentName, finalProps, newInstance);
    }

    /**
     * Removes the {@link ReactRootView} for the given miniapp (if present) from the list and also
     * unmounts the application.
     *
     * @param componentName {@link String} React native app view component name
     * @deprecated use {@link #removeMiniAppView(String, ReactRootView)}.
     */
    @Deprecated
    public void removeMiniAppView(@NonNull String componentName) {
        ReactRootViewHolder reactRootViewHolder = mReactRootViews.get(componentName);
        if (reactRootViewHolder != null) {
            reactRootViewHolder.remove(componentName);
            if (reactRootViewHolder.size() == 0) {
                mReactRootViews.remove(componentName);
            }
        }
    }

    public void removeMiniAppView(@NonNull String componentName, @NonNull ReactRootView rootView) {
        ReactRootViewHolder reactRootViewHolder = mReactRootViews.get(componentName);
        if (reactRootViewHolder != null) {
            reactRootViewHolder.remove(rootView);
            if (reactRootViewHolder.size() == 0) {
                mReactRootViews.remove(componentName);
            }
        }
    }

    @Override
    protected void loadApp(String appKey) {
        ReactRootView rootView = getReactAppView(appKey, getLaunchOptions(), false);
        getPlainActivity().setContentView(rootView);
    }

    @Nullable
    private ReactRootView getReactAppView(
            @NonNull String componentName, @Nullable Bundle props, boolean newInstance) {
        ReactRootViewHolder rootViewHolder = mReactRootViews.get(componentName);

        if (rootViewHolder == null || newInstance || rootViewHolder.size() > 1) {
            ReactRootView rootView = createRootView();
            rootView.startReactApplication(
                    ElectrodeReactContainer.getReactInstanceManager(), componentName, props);
            if (rootViewHolder == null) {
                rootViewHolder = new ReactRootViewHolder(componentName, rootView);
                mReactRootViews.put(componentName, rootViewHolder);
            } else {
                rootViewHolder.add(rootView);
            }
            return rootView;
        } else {
            ReactRootView rootView = rootViewHolder.getFirstIfSingle();
            rootView.setAppProperties(props);
            return rootView;
        }
    }

    @Override
    protected ReactNativeHost getReactNativeHost() {
        return ElectrodeReactContainer.getReactNativeHost();
    }

    @Override
    public void onDestroy() {
        unMountReactApplications();
        super.onDestroy();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onPause() {
        super.onPause();
    }

    // NOTE: Duplicate of super class because of how DefaultHardwareBackBtnHandler is handled in
    // Electrode Native
    @Override
    public void onResume() {
        if (getReactNativeHost().hasInstance()) {
            DefaultHardwareBackBtnHandler hardwareBackBtnHandler =
                    (getPlainActivity() instanceof DefaultHardwareBackBtnHandler)
                            ? (DefaultHardwareBackBtnHandler) getPlainActivity()
                            : mDefaultHardwareBackBtnHandler;
            getReactNativeHost()
                    .getReactInstanceManager()
                    .onHostResume(getPlainActivity(), hardwareBackBtnHandler);
        }

        if (mPermissionsCallback != null) {
            mPermissionsCallback.invoke();
            mPermissionsCallback = null;
        }
    }

    /*Duplicated*/
    @Override
    @TargetApi(Build.VERSION_CODES.M)
    public void requestPermissions(
            String[] permissions, int requestCode, PermissionListener listener) {
        mPermissionListener = listener;
        getPlainActivity().requestPermissions(permissions, requestCode);
    }

    /*Duplicated*/
    @Override
    public void onRequestPermissionsResult(
            final int requestCode, final String[] permissions, final int[] grantResults) {
        mPermissionsCallback =
                new Callback() {
                    @Override
                    public void invoke(Object... args) {
                        if (mPermissionListener != null
                                && mPermissionListener.onRequestPermissionsResult(
                                requestCode, permissions, grantResults)) {
                            mPermissionListener = null;
                        }
                    }
                };
    }

    public void setBackKeyHandler(@NonNull BackKeyHandler backKeyHandler) {
        mBackKeyHandler = backKeyHandler;
    }

    /**
     * @param hostActivity
     * @deprecated call {@link #onResume()} instead
     */
    @Deprecated
    public void onResume(@NonNull Activity hostActivity) {
        onResume();
    }

    /**
     * Call this method from within your Activity onPause
     *
     * @deprecated call {@link #onResume()} instead
     */
    @Deprecated
    public void onPause(@NonNull Activity activity) {
        onPause();
    }

    /**
     * @deprecated call {@link #onDestroy()} instead
     */
    @Deprecated
    public void onDestroy(Activity activity) {
        onDestroy();
    }

    /**
     * @deprecated Use {@link #onActivityResult(int, int, Intent)} instead
     */
    @Deprecated
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
    }

    /**
     * @return True if developer menu can be displayed (dev mode), false otherwise
     */
    public boolean canShowDeveloperMenu() {
        return ElectrodeReactContainer.getReactInstanceManager()
                .getDevSupportManager()
                .getDevSupportEnabled();
    }

    /**
     * Displays the react native developer menu
     */
    public void showDeveloperMenu() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            showDeveloperMenuMarshmallow();
        } else {
            ElectrodeReactContainer.getReactInstanceManager()
                    .getDevSupportManager()
                    .showDevOptionsDialog();
        }
    }

    public void reload() {
        ElectrodeReactContainer.getReactInstanceManager().getDevSupportManager().handleReloadJS();
    }

    @TargetApi(Build.VERSION_CODES.M)
    private void showDeveloperMenuMarshmallow() {
        if (Settings.canDrawOverlays(
                ElectrodeReactContainer.getReactInstanceManager().getCurrentReactContext())) {
            ElectrodeReactContainer.getReactInstanceManager()
                    .getDevSupportManager()
                    .showDevOptionsDialog();
        }
    }

    private void unMountReactApplications() {
        List<ReactRootViewHolder> list;
        synchronized (mReactRootViews) {
            list = new ArrayList<>(mReactRootViews.values());
            mReactRootViews.clear();
        }

        for (ReactRootViewHolder viewHolder : list) {
            viewHolder.unMountAll();
        }
    }

    public interface BackKeyHandler {
        void onBackKey();
    }

    private class ReactRootViewHolder {
        private final String mComponentName;
        private final Set<ReactRootView> mRootViews = new HashSet<>();

        private ReactRootViewHolder(
                @NonNull String componentName, @NonNull ReactRootView rootView) {
            mComponentName = componentName;
            mRootViews.add(rootView);
        }

        /**
         * Removes the react native view if present.
         *
         * @param rootView {@link ReactRootView}
         * @return true | false
         */
        public boolean remove(@NonNull ReactRootView rootView) {
            for (ReactRootView view : mRootViews) {
                if (view == rootView) {
                    view.unmountReactApplication();
                    mRootViews.remove(rootView);
                    return true;
                }
            }
            return false;
        }

        public void unMountAll() {
            for (ReactRootView view : mRootViews) {
                view.unmountReactApplication();
            }
            mRootViews.clear();
        }

        /**
         * This method is kept for backward compatibility only. Should be cleaned once the
         * deprecated {@link #removeMiniAppView(String)} methods are removed. Un-mounts and remove
         * the view only if this application has only one view created.
         *
         * @param componentName name of the react component
         * @return true | false
         */
        public boolean remove(@NonNull String componentName) {
            if (mRootViews.size() == 1) {
                mRootViews.iterator().next().unmountReactApplication();
                mRootViews.clear();
                return true;
            }
            return false;
        }

        public void add(@NonNull ReactRootView rootView) {
            mRootViews.add(rootView);
        }

        public int size() {
            return mRootViews.size();
        }

        /**
         * This method is kept for keeping the backward compatibility. Should we cleaned once the
         * deprecated {@link #createMiniAppRootView(String)} methods are removed.
         *
         * @return
         */
        public ReactRootView getFirstIfSingle() {
            if (mRootViews.size() == 1) {
                return mRootViews.iterator().next();
            } else {
                throw new IllegalStateException(
                        "Expected one react root view in the list but found " + mRootViews.size());
            }
        }
    }
}
