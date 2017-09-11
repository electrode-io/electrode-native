package com.walmartlabs.ern.container;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.MenuItem;
import android.view.View;

public class ElectrodeMiniAppActivity extends Activity implements ElectrodeReactActivityDelegate.BackKeyHandler {

    private static final String INITIAL_PROPS = "props";
    private ElectrodeReactActivityDelegate mReactActivityDelegate;

    /**
     * Method that helps to pass bundle to react native side.
     *
     * @param intent Intent that will start the activity
     * @param bundle Bundle that you would like to pass to react native.
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
        mReactActivityDelegate = new ElectrodeReactActivityDelegate();
        mReactActivityDelegate.setBackKeyHandler(this);
        View reactRootView = mReactActivityDelegate.onCreate(this, getMiniAppName(), getIntent().getBundleExtra(INITIAL_PROPS));

        if (reactRootView != null) {
            setContentView(reactRootView);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        mReactActivityDelegate.onPause(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        mReactActivityDelegate.onResume(this);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mReactActivityDelegate.onDestroy(this);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home:
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
        mReactActivityDelegate.onActivityResult(this, requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        final boolean isMenuKey = (keyCode == KeyEvent.KEYCODE_MENU);

        if (isMenuKey
                && ElectrodeReactContainer.getInstance().isReactNativeDeveloperSupport()
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
}
