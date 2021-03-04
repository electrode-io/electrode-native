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

package com.complex.ern.api;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import java.util.List;

import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.*;

public class TestEventObjectParamData implements Parcelable, Bridgeable {
    public static final Creator<TestEventObjectParamData> CREATOR =
            new Creator<TestEventObjectParamData>() {
                @Override
                public TestEventObjectParamData createFromParcel(Parcel in) {
                    return new TestEventObjectParamData(in);
                }

                @Override
                public TestEventObjectParamData[] newArray(int size) {
                    return new TestEventObjectParamData[size];
                }
            };

    private String param1;
    private Bundle param2;

    private TestEventObjectParamData() {
    }

    private TestEventObjectParamData(Builder builder) {
        this.param1 = builder.param1;
        this.param2 = builder.param2;
    }

    private TestEventObjectParamData(Parcel in) {
        this(in.readBundle());
    }

    public TestEventObjectParamData(@NonNull Bundle bundle) {
        this.param1 = bundle.getString("param1");
        this.param2 = bundle.containsKey("param2") ? bundle.getBundle("param2") : null;
    }

    /**
     * This is param1
     *
     * @return String
     */
    @Nullable
    public String getparam1() {
        return param1;
    }

    /**
     * This is param2
     *
     * @return Bundle
     */
    @Nullable
    public Bundle getparam2() {
        return param2;
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
        if (param1 != null) {
            bundle.putString("param1", this.param1 );
        }
        return bundle;
    }

    public static class Builder {
        private String param1;
        private Bundle param2;

        public Builder() {
        }

        @NonNull
        public Builder param1(@Nullable String param1) {
            this.param1 = param1;
            return this;
        }
        @NonNull
        public Builder param2(@Nullable Bundle param2) {
            this.param2 = param2;
            return this;
        }

        @NonNull
        public TestEventObjectParamData build() {
            return new TestEventObjectParamData(this);
        }
    }
}
