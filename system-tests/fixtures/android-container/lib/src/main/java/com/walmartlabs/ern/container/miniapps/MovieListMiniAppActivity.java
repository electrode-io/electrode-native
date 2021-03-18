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

import androidx.annotation.NonNull;

import com.ern.api.impl.navigation.ElectrodeBaseActivity;
import com.walmartlabs.ern.container.R;

public class MovieListMiniAppActivity extends ElectrodeBaseActivity {
    @Override
    protected int mainLayout() {
        return R.layout.activity_host_miniapp;
    }

    @NonNull
    @Override
    protected String getRootComponentName() {
        return "MovieListMiniApp";
    }

    @Override
    protected int getFragmentContainerId() {
        return R.id.fragment_container;
    }
}
