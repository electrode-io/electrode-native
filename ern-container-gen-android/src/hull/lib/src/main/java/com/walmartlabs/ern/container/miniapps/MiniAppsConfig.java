{{>licenseInfo}}

package com.walmartlabs.ern.container.miniapps;

{{>generatedCode}}

import com.walmartlabs.ern.container.ElectrodeMiniAppActivity;

import android.support.annotation.NonNull;

import java.util.HashMap;

public class MiniAppsConfig {
    public static final HashMap<String, Class> MINIAPP_ACTIVITIES =
            new HashMap<String, Class>() {
                {
{{#miniApps}}
                    put(MiniApps.{{normalizedName}}.getName(), MiniApps.{{normalizedName}}.getActivityClass());
{{/miniApps}}
                }
            };

    public enum MiniApps {
{{#miniApps}}
        {{normalizedName}}("{{normalizedName}}", {{pascalCaseName}}Activity.class),
{{/miniApps}}
        ;

        private final String mMiniAppName;
        private final Class<? extends ElectrodeMiniAppActivity> mActivityClass;

        MiniApps(String miniAppName, Class<? extends ElectrodeMiniAppActivity> activityClass) {
            mMiniAppName = miniAppName;
            mActivityClass = activityClass;
        }

        @NonNull
        public Class<? extends ElectrodeMiniAppActivity> getActivityClass() {
            return mActivityClass;
        }

        @NonNull
        public String getName() {
            return mMiniAppName;
        }
    }
}
