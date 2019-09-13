package com.walmartlabs.ern.container.devassist;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.CheckBoxPreference;
import android.preference.EditTextPreference;
import android.preference.ListPreference;
import android.preference.Preference;
import android.preference.PreferenceActivity;
import android.preference.PreferenceManager;
import android.preference.SwitchPreference;
import android.support.annotation.NonNull;
import android.text.format.DateFormat;
import android.widget.Toast;

import com.facebook.react.modules.network.OkHttpClientProvider;
import com.walmartlabs.ern.container.ElectrodeReactContainer;
import com.walmartlabs.ern.container.R;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Locale;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

public class ErnDevSettingsActivity extends PreferenceActivity {
    protected SharedPreferences mPreferences;
    protected ListPreference mPrefBundleId;
    protected ListPreference mPrefStoreId;
    protected CheckBoxPreference mPrefAutoReload;
    protected SwitchPreference mPrefStoreEnabled;
    protected EditTextPreference mPrefHost;
    protected String mHost;
    protected String mStoreId;
    protected boolean mAutoReload;
    protected boolean mStoreEnabled;
    protected String mBundleId;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTitle("Electrode Native Settings");

        mPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        mHost = mPreferences.getString(getString(R.string.ern_bundle_store_host),
                ElectrodeReactContainer.getConfig().getBundleStoreHostPort());
        mBundleId =
                mPreferences.getString(getString(R.string.ern_bundle_store_bundle_id), "");
        mAutoReload =
                mPreferences.getBoolean(getString(R.string.ern_bundle_store_auto_reload), true);
        mStoreEnabled =
                mPreferences.getBoolean(getString(R.string.ern_bundle_store_enabled), false);
        mStoreId =
                mPreferences.getString(getString(R.string.ern_bundle_store_store_id), "");

        addPreferencesFromResource(R.xml.ern_dev_preferences);

        mPrefHost =
                (EditTextPreference) findPreference(getString(R.string.ern_bundle_store_host));
        mPrefStoreId =
                (ListPreference) findPreference(getString(R.string.ern_bundle_store_store_id));
        mPrefBundleId =
                (ListPreference) findPreference(getString(R.string.ern_bundle_store_bundle_id));
        mPrefAutoReload =
                (CheckBoxPreference) findPreference(getString(R.string.ern_bundle_store_auto_reload));
        mPrefStoreEnabled =
                (SwitchPreference) findPreference(getString(R.string.ern_bundle_store_enabled));

        mPrefHost.setSummary(mHost);
        mPrefHost.setText(mHost);
        mPrefStoreId.setSummary(mStoreId);
        mPrefBundleId.setSummary(mBundleId);

        if (mStoreEnabled) {
            mPrefStoreEnabled.setTitle("Disable");
        } else {
            mPrefStoreEnabled.setTitle("Enable");
        }

        mPrefBundleId.setEnabled(mStoreEnabled);
        mPrefStoreId.setEnabled(mStoreEnabled);
        mPrefAutoReload.setEnabled(mStoreEnabled);
        mPrefHost.setEnabled(mStoreEnabled);

        //
        // Disable React Native bundle deltas feature (not supported by bundle store server)
        mPreferences.edit().putBoolean("js_bundle_deltas", false).apply();

        mPrefHost.setOnPreferenceChangeListener(new Preference.OnPreferenceChangeListener() {
            @Override
            public boolean onPreferenceChange(Preference preference, Object newValue) {
                mHost = (String) newValue;
                mPrefHost.setSummary(mHost);
                reloadStoreList();
                return true;
            }
        });

        mPrefStoreId.setOnPreferenceChangeListener(new Preference.OnPreferenceChangeListener() {
            @Override
            public boolean onPreferenceChange(Preference preference, Object newValue) {
                mStoreId = (String) newValue;
                mPrefStoreId.setSummary(mStoreId);
                reloadBundleList(true);
                return true;
            }
        });

        mPrefBundleId.setOnPreferenceChangeListener(new Preference.OnPreferenceChangeListener() {
            @Override
            public boolean onPreferenceChange(Preference preference, Object newValue) {
                mBundleId = (String) newValue;
                mPrefBundleId.setSummary(mBundleId);
                mPreferences.edit().putString(
                        getString(R.string.debug_http_host),
                        String.format(
                                "%s/bundles/%s/android/%s", mHost, mStoreId, mBundleId)).commit();
                if (mAutoReload) {
                    ElectrodeReactContainer
                            .getReactInstanceManager().getDevSupportManager().handleReloadJS();
                }
                return true;
            }
        });

        mPrefAutoReload.setOnPreferenceChangeListener(new Preference.OnPreferenceChangeListener() {
            @Override
            public boolean onPreferenceChange(Preference preference, Object newValue) {
                mAutoReload = (Boolean) newValue;
                return true;
            }
        });

        mPrefStoreEnabled.setOnPreferenceChangeListener(
                new Preference.OnPreferenceChangeListener() {
                    @Override
                    public boolean onPreferenceChange(Preference preference, Object newValue) {
                        mStoreEnabled = (Boolean) newValue;
                        if (mStoreEnabled) {
                            mPrefAutoReload.setEnabled(true);
                            mPrefHost.setEnabled(true);
                            mPrefStoreEnabled.setTitle("Disable");
                            reloadStoreList();
                            if (mStoreId != null
                                    && !mStoreId.equals("")
                                    && mBundleId != null
                                    && !mBundleId.equals("")) {
                                mPreferences.edit().putString(
                                        getString(R.string.debug_http_host),
                                        getDebugHttpHostUrl()).commit();
                                if (mAutoReload) {
                                    ElectrodeReactContainer
                                            .getReactInstanceManager()
                                            .getDevSupportManager().handleReloadJS();
                                }
                            }
                        } else {
                            mPrefAutoReload.setEnabled(false);
                            mPrefBundleId.setEnabled(false);
                            mPrefStoreId.setEnabled(false);
                            mPrefHost.setEnabled(false);
                            mPrefStoreEnabled.setTitle("Enable");
                            ElectrodeReactContainer
                                    .getReactInstanceManager().recreateReactContextInBackground();
                        }
                        return true;
                    }
                });

        if (mStoreEnabled) {
            reloadStoreList();
            if (mStoreId != null && !mStoreId.equals("")) {
                reloadBundleList(false);
            }
        }
    }

    public void reloadStoreList() {
        mPrefStoreId.setEnabled(false);
        mPrefBundleId.setEnabled(false);
        Request request = new Request.Builder()
                .url(getStoreListUrl())
                .build();

        OkHttpClient client = OkHttpClientProvider.getOkHttpClient();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                showErrorToast(String.format(
                        Locale.getDefault(),
                        "%s [%s]",
                        getStoreListUrl(),
                        e.getLocalizedMessage()));
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mPrefStoreId.setEnabled(false);
                        mPrefBundleId.setEnabled(false);
                    }
                });
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) {
                if (response.isSuccessful()) {
                    try {
                        final ArrayList<String> arrEntries = new ArrayList<>();
                        final ArrayList<String> arrValues = new ArrayList<>();
                        ResponseBody responseBody = response.body();
                        if (responseBody == null) {
                            showErrorToast(String.format(
                                    Locale.getDefault(),
                                    "%s [no response body]",
                                    getStoreListUrl()));
                            return;
                        }
                        JSONArray jArray = new JSONArray(responseBody.string());
                        if (jArray.length() > 0) {
                            for (int i = 0; i < jArray.length(); i++) {
                                String store = jArray.getString(i);
                                arrEntries.add(store);
                                arrValues.add(store);
                            }

                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    mPrefStoreId.setEntries(
                                            arrEntries.toArray(new String[0]));
                                    mPrefStoreId.setEntryValues(
                                            arrValues.toArray(new String[0]));
                                    mPrefStoreId.setEnabled(true);
                                    mPrefBundleId.setEnabled(true);
                                }
                            });
                        }
                    } catch (IOException | JSONException e) {
                        showErrorToast(String.format(
                                Locale.getDefault(),
                                "%s [%s]",
                                getStoreListUrl(),
                                e.getLocalizedMessage()));
                    }
                } else {
                    showErrorToast(String.format(
                            Locale.getDefault(),
                            "%s [HTTP %d]",
                            getStoreListUrl(),
                            response.code()));
                }
            }
        });
    }

    public void reloadBundleList(final boolean shouldSetLatest) {
        mPrefBundleId.setEnabled(false);
        Request request = new Request.Builder()
                .url(getBundleListUrl())
                .build();

        OkHttpClient client = OkHttpClientProvider.getOkHttpClient();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                showErrorToast(String.format(
                        Locale.getDefault(),
                        "%s [%s]",
                        getBundleListUrl(),
                        e.getLocalizedMessage()));
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mPrefBundleId.setEnabled(false);
                    }
                });
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull final Response response) {
                if (response.isSuccessful()) {
                    try {
                        final ArrayList<String> arrEntries = new ArrayList<>();
                        final ArrayList<String> arrValues = new ArrayList<>();
                        arrEntries.add("latest");
                        arrValues.add("latest");
                        ResponseBody responseBody = response.body();
                        if (responseBody == null) {
                            showErrorToast(String.format(
                                    Locale.getDefault(),
                                    "%s [no response body]",
                                    getBundleListUrl()));
                            return;
                        }
                        JSONArray jArray = new JSONArray(responseBody.string());

                        if (jArray.length() > 0) {
                            for (int i = 0; i < jArray.length(); i++) {
                                JSONObject bundle = jArray.getJSONObject(i);
                                String id = bundle.getString("id");
                                long timestamp = bundle.getLong("timestamp");
                                Calendar cal = Calendar.getInstance();
                                cal.setTimeInMillis(timestamp/* * 1000L*/);
                                String date =
                                        DateFormat.format("dd-MM-yyyy hh:mm", cal)
                                                .toString();
                                arrEntries.add(date);
                                arrValues.add(id);
                            }

                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    mPrefBundleId.setEntries(arrEntries.toArray(new String[0]));
                                    mPrefBundleId.setEntryValues(arrValues.toArray(new String[0]));
                                    mPrefBundleId.setEnabled(true);
                                    if (shouldSetLatest) {
                                        mPrefBundleId.setSummary("latest");
                                        mPrefBundleId.setValue("latest");
                                        mBundleId = "latest";
                                        mPreferences.edit().putString(
                                                getString(R.string.ern_bundle_store_bundle_id),
                                                "latest").apply();
                                        mPreferences.edit().putString(
                                                getString(R.string.debug_http_host),
                                                getDebugHttpHostUrl()).commit();
                                        if (mAutoReload) {
                                            ElectrodeReactContainer
                                                .getReactInstanceManager()
                                                .getDevSupportManager().handleReloadJS();
                                        }
                                    }  
                                }
                            });
                        }
                    } catch (IOException | JSONException e) {
                        showErrorToast(String.format(
                                Locale.getDefault(),
                                "%s [%s]",
                                getBundleListUrl(),
                                e.getLocalizedMessage()));
                    }
                } else {
                    showErrorToast(String.format(
                            Locale.getDefault(),
                            "%s [HTTP %d]",
                            getBundleListUrl(),
                            response.code()));
                }
            }
        });
    }

    public String getBundleListUrl() {
        return String.format("http://%s/bundles/%s/android", mHost, mStoreId);
    }

    public String getStoreListUrl() {
        return String.format("http://%s/stores", mHost);
    }

    public String getDebugHttpHostUrl() {
        return String.format("%s/bundles/%s/android/%s", mHost, mStoreId, mBundleId);
    }

    public void showErrorToast(@NonNull final String msg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(ErnDevSettingsActivity.this, msg, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
