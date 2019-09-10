package com.walmartlabs.ern;

import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.MenuItem;
import android.view.View;

import androidx.annotation.CallSuper;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StringRes;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.ern.api.impl.core.ElectrodeReactFragmentActivityDelegate;
import com.ern.api.impl.navigation.MiniAppNavFragment;
import com.ern.api.impl.navigation.MiniAppNavRequestListener;
import com.ern.api.impl.navigation.OnNavBarItemClickListener;
import com.ern.api.impl.navigation.Route;
import com.ernnavigationApi.ern.model.NavigationBar;
import com.facebook.react.ReactRootView;

import org.json.JSONObject;

// This is the main activity that gets launched upon app start
// It just launches the activity containing the miniapp
// Feel free to modify it at your convenience.

public class MainActivity extends AppCompatActivity
        implements ElectrodeReactFragmentActivityDelegate.DataProvider, MiniAppNavRequestListener {

    public static final int DEFAULT_TITLE = -1;

    private ElectrodeReactFragmentActivityDelegate mElectrodeReactNavDelegate;

    /**
     * Return the title for
     *
     * @return
     */
    @StringRes
    protected int title() {
        return DEFAULT_TITLE;
    }

    @Override
    @CallSuper
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mElectrodeReactNavDelegate = new ElectrodeReactFragmentActivityDelegate(this);
        this.getLifecycle().addObserver(mElectrodeReactNavDelegate);
        mElectrodeReactNavDelegate.onCreate(savedInstanceState);

        if (title() != DEFAULT_TITLE && getSupportActionBar() != null) {
            getSupportActionBar().setTitle(getString(title()));
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mElectrodeReactNavDelegate = null;
    }

    @Override
    public void onBackPressed() {
        if (!mElectrodeReactNavDelegate.onBackPressed()) {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        mElectrodeReactNavDelegate.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (mElectrodeReactNavDelegate.onKeyUp(keyCode, event)) {
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }

    @NonNull
    @Override
    public String getRootComponentName() {
        return "{{{miniAppName}}}";
    }

    @Override
    public int getFragmentContainerId() {
        return R.id.fragment_container;
    }

    @Nullable
    @Override
    public Bundle getProps() {
        return null;
    }

    @NonNull
    @Override
    public Class<? extends Fragment> miniAppFragmentClass() {
        return MiniAppNavFragment.class;
    }

    @Override
    public boolean navigate(Route route) {
        return false;
    }

    @Override
    public void finishFlow(@Nullable JSONObject finalPayload) {
        finish();
    }

    @Override
    public void updateNavBar(@NonNull NavigationBar navigationBar,
            @NonNull OnNavBarItemClickListener navBarButtonClickListener) {
        // Deprecated. Do nothing. This method will be removed in a future release.
    }

    @Override
    public boolean backToMiniApp(@Nullable String miniAppComponentName) {
        return mElectrodeReactNavDelegate.switchBackToFragment(miniAppComponentName);
    }

    @Override
    public View createReactNativeView(@NonNull String componentName, @Nullable Bundle props) {
        return mElectrodeReactNavDelegate.createReactRootView(componentName, props);
    }

    @Override
    public void removeReactNativeView(@NonNull String componentName) {
        mElectrodeReactNavDelegate.removeMiniAppView(componentName);
    }

    @Override
    public void removeReactNativeView(@NonNull String componentName, @NonNull ReactRootView reactRootView) {
        mElectrodeReactNavDelegate.removeMiniAppView(componentName, reactRootView);
    }

    @Override
    public void startMiniAppFragment(@NonNull String componentName, @Nullable Bundle props) {
        mElectrodeReactNavDelegate.startMiniAppFragment(componentName, props);
    }

    @Override
    public void startMiniAppFragment(@NonNull Class<? extends Fragment> fragmentClass, @NonNull String componentName,
            @Nullable Bundle props) {
        mElectrodeReactNavDelegate.startMiniAppFragment(fragmentClass, componentName, props);
    }

    @Nullable
    @Override
    public Bundle globalProps() {
        return null;
    }

    @Override
    public boolean showDevMenuIfDebug(KeyEvent event) {
        return false;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (mElectrodeReactNavDelegate.onOptionsItemSelected(item)) {
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
