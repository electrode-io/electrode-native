{{>licenseInfo}}

package com.walmartlabs.ern.container;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.RequiresApi;
import android.view.KeyEvent;
import android.view.MenuItem;
import android.view.View;

import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

public class ElectrodeMiniAppActivity extends Activity
        implements ElectrodeReactActivityDelegate.BackKeyHandler, PermissionAwareActivity {
    private static final String INITIAL_PROPS = "props";
    private ElectrodeReactActivityDelegate mReactActivityDelegate;

    /**
     * Method that helps to pass bundle to react native side.
     *
     * @param intent Intent that will start the activity
     * @param bundle Bundle that you would like to pass to react native.
     * @deprecated
     */
    public static void addInitialProps(@NonNull Intent intent, @NonNull Bundle bundle) {
        intent.putExtra(INITIAL_PROPS, bundle);
    }

    protected String getMiniAppName() {
        return null;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mReactActivityDelegate = new ElectrodeReactActivityDelegate(this);
        mReactActivityDelegate.setBackKeyHandler(this);
        View reactRootView =
                mReactActivityDelegate.createMiniAppRootView(
                        getMiniAppName(), getIntent().getBundleExtra(INITIAL_PROPS));

        if (reactRootView != null) {
            setContentView(reactRootView);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        mReactActivityDelegate.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        mReactActivityDelegate.onResume();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mReactActivityDelegate.onDestroy();
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onBackPressed() {
        mReactActivityDelegate.onBackPressed();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        mReactActivityDelegate.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_MENU
                && ElectrodeReactContainer.isReactNativeDeveloperSupport()
                && mReactActivityDelegate.canShowDeveloperMenu()) {
            mReactActivityDelegate.showDeveloperMenu();
            return true;
        }

        return super.onKeyUp(keyCode, event);
    }

    @Override
    public void onBackKey() {
        finish();
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    @Override
    public void requestPermissions(
            String[] permissions, int requestCode, PermissionListener listener) {
        mReactActivityDelegate.requestPermissions(permissions, requestCode, listener);
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    @Override
    public void onRequestPermissionsResult(
            int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        mReactActivityDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
}
