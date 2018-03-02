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

package com.ernnavigation.ern.api;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import java.util.List;
import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.*;

public class NavigateData implements Parcelable, Bridgeable {

    private String miniAppName;
    private String initialPayload;

    private NavigateData() {}

    private NavigateData(Builder builder) {
        this.miniAppName = builder.miniAppName;
        this.initialPayload = builder.initialPayload;
    }

    private NavigateData(Parcel in) {
        this(in.readBundle());
    }

    public NavigateData(@NonNull Bundle bundle) {
        if(bundle.get("miniAppName") == null){
            throw new IllegalArgumentException("miniAppName property is required");
        }
        this.miniAppName = bundle.getString("miniAppName");
        this.initialPayload = bundle.getString("initialPayload");
    }

    public static final Creator<NavigateData> CREATOR = new Creator<NavigateData>() {
        @Override
        public NavigateData createFromParcel(Parcel in) {
            return new NavigateData(in);
        }

        @Override
        public NavigateData[] newArray(int size) {
            return new NavigateData[size];
        }
    };

    /**
    * Component name of the miniapp
    *
    * @return String
    */
    @NonNull
    public String getminiAppName() {
        return miniAppName;
    }

    /**
    * Payload required for the miniapp
    *
    * @return String
    */
    @Nullable
    public String getinitialPayload() {
        return initialPayload;
    }


    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeBundle(toBundle());
    }

    @NonNull
    @Override
    public Bundle toBundle() {
        Bundle bundle = new Bundle();
        this.miniAppName = bundle.getString("miniAppName");
        if(initialPayload != null) {
            this.initialPayload = bundle.getString("initialPayload");
        }
        return bundle;
    }

    public static class Builder {
        private final String miniAppName;
        private String initialPayload;

        public Builder(@NonNull String miniAppName) {
            this.miniAppName = miniAppName;
        }

        @NonNull
        public Builder initialPayload(@Nullable String initialPayload) {
            this.initialPayload = initialPayload;
            return this;
        }

        @NonNull
        public NavigateData build() {
            return new NavigateData(this);
        }
    }
}