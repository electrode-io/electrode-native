package com.walmartlabs.ern.dummy;

import androidx.annotation.NonNull;

import com.ern.api.impl.navigation.ElectrodeBaseActivity;

// This is the main activity that gets launched upon app start
// It just launches the activity containing the miniapp
// Feel free to modify it at your convenience.

public class MainActivity extends ElectrodeBaseActivity {
    @NonNull
    @Override
    public String getRootComponentName() {
        return "dummy";
    }

    @Override
    protected int mainLayout() {
        return R.layout.activity_main;
    }

    @Override
    public int getFragmentContainerId() {
        return R.id.fragment_container;
    }
}
