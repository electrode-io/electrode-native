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

package com.walmartlabs.ern.container.miniapps;


// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// THIS CLASS IS AUTO GENERATED.
// DO NOT EDIT MANUALLY
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import android.support.annotation.NonNull;
import com.walmartlabs.ern.container.ElectrodeMiniAppActivity;
import java.util.HashMap;

public class MiniAppsConfig {
     public enum MiniApps {
        MovieListMiniApp("MovieListMiniApp", MovieListMiniAppActivity.class),
        MovieDetailsMiniApp("MovieDetailsMiniApp", MovieDetailsMiniAppActivity.class),
        ;

        private final String miniAppName;
        private final Class<? extends ElectrodeMiniAppActivity> activityClass;

        MiniApps(String miniAppName, Class<? extends ElectrodeMiniAppActivity> miniAppActivityClass) {
            this.miniAppName = miniAppName;
            this.activityClass = miniAppActivityClass;
        }

        @NonNull
        public Class<? extends ElectrodeMiniAppActivity> getActivityClass() {
            return activityClass;
        }

        @NonNull
        public String getName() {
            return miniAppName;
        }
    }

    public static final HashMap<String, Class> MINIAPP_ACTIVITIES = new HashMap<String, Class>() {{
        put(MiniApps.MovieListMiniApp.getName(), MiniApps.MovieListMiniApp.getActivityClass());
        put(MiniApps.MovieDetailsMiniApp.getName(), MiniApps.MovieDetailsMiniApp.getActivityClass());
    }};
}
