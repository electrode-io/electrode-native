/*
 * Copyright 2020 Walmart Labs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.walmartlabs.ern.container.miniapps;

//
// GENERATED CODE: DO NOT MODIFY
//

import androidx.annotation.NonNull;

import com.ern.api.impl.navigation.ElectrodeBaseActivity;

import java.util.HashMap;

public class MiniAppsConfig {
    public static final HashMap<String, Class> MINIAPP_ACTIVITIES =
            new HashMap<String, Class>() {
                {
                    put(MiniApps.MovieDetailsMiniApp.getName(), MiniApps.MovieDetailsMiniApp.getActivityClass());
                    put(MiniApps.MovieListMiniApp.getName(), MiniApps.MovieListMiniApp.getActivityClass());
                }
            };

    public enum MiniApps {
        MovieDetailsMiniApp("MovieDetailsMiniApp", MovieDetailsMiniAppActivity.class),
        MovieListMiniApp("MovieListMiniApp", MovieListMiniAppActivity.class),
        ;

        private final String mMiniAppName;
        private final Class<? extends ElectrodeBaseActivity> mActivityClass;

        MiniApps(String miniAppName, Class<? extends ElectrodeBaseActivity> activityClass) {
            mMiniAppName = miniAppName;
            mActivityClass = activityClass;
        }

        @NonNull
        public Class<? extends ElectrodeBaseActivity> getActivityClass() {
            return mActivityClass;
        }

        @NonNull
        public String getName() {
            return mMiniAppName;
        }
    }
}
