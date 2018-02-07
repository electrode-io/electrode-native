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

package com.ComplexApi.ern.api;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import java.util.List;
import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.*;

public class TestMultiArgsData implements Parcelable, Bridgeable {

    private String key1;
    private Integer key2;

    private TestMultiArgsData() {}

    private TestMultiArgsData(Builder builder) {
        this.key1 = builder.key1;
        this.key2 = builder.key2;
    }

    private TestMultiArgsData(Parcel in) {
        this(in.readBundle());
    }

    public TestMultiArgsData(@NonNull Bundle bundle) {
        if(bundle.get("key1") == null){
            throw new IllegalArgumentException("key1 property is required");
        }
        if(bundle.get("key2") == null){
            throw new IllegalArgumentException("key2 property is required");
        }
        this.key1 = bundle.getString("key1");
        this.key2 = getNumberValue(bundle, "key2") == null ? null : getNumberValue(bundle, "key2").intValue();
    }

    public static final Creator<TestMultiArgsData> CREATOR = new Creator<TestMultiArgsData>() {
        @Override
        public TestMultiArgsData createFromParcel(Parcel in) {
            return new TestMultiArgsData(in);
        }

        @Override
        public TestMultiArgsData[] newArray(int size) {
            return new TestMultiArgsData[size];
        }
    };

    /**
    * first argument
    *
    * @return String
    */
    @NonNull
    public String getkey1() {
        return key1;
    }

    /**
    * second argument
    *
    * @return Integer
    */
    @NonNull
    public Integer getkey2() {
        return key2;
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
        this.key1 = bundle.getString("key1");
        this.key2 = getNumberValue(bundle, "key2") == null ? null : getNumberValue(bundle, "key2").intValue();
        return bundle;
    }

    public static class Builder {
        private final String key1;
        private final Integer key2;

        public Builder(@NonNull String key1, @NonNull Integer key2) {
            this.key1 = key1;
            this.key2 = key2;
        }


        @NonNull
        public TestMultiArgsData build() {
            return new TestMultiArgsData(this);
        }
    }
}