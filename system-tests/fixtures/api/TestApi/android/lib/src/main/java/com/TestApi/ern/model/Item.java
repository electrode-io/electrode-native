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

package com.TestApi.ern.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import java.util.List;

import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.*;

public class Item implements Parcelable, Bridgeable {

    private Long id;
    private String name;
    private String desc;

    private Item() {}

    private Item(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
        this.desc = builder.desc;
    }

    private Item(Parcel in) {
        this(in.readBundle());
    }

    public Item(@NonNull Bundle bundle) {
        if(!bundle.containsKey("id")){
            throw new IllegalArgumentException("id property is required");
        }

        if(!bundle.containsKey("name")){
            throw new IllegalArgumentException("name property is required");
        }

        this.id = getNumberValue(bundle, "id") == null ? null : getNumberValue(bundle, "id").longValue();
        this.name = bundle.getString("name");
        this.desc = bundle.getString("desc");
    }

    public static final Creator<Item> CREATOR = new Creator<Item>() {
        @Override
        public Item createFromParcel(Parcel in) {
            return new Item(in);
        }

        @Override
        public Item[] newArray(int size) {
            return new Item[size];
        }
    };

    @NonNull
    public Long getId() {
        return id;
    }

    @NonNull
    public String getName() {
        return name;
    }

    @Nullable
    public String getDesc() {
        return desc;
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
        bundle.putLong("id", this.id);
        bundle.putString("name", this.name);
        if(desc != null) {
            bundle.putString("desc", this.desc );
        }
        return bundle;
    }

    @Override
    public String toString() {
        return "{"
        + "id:" + id+ ","
        + "name:" + (name != null ? "\"" + name + "\"" : null)+ ","
        + "desc:" + (desc != null ? "\"" + desc + "\"" : null)
        + "}";
    }

    public static class Builder {
        private final Long id;
        private final String name;
        private String desc;

        public Builder(@NonNull Long id, @NonNull String name) {
            this.id = id;
            this.name = name;
        }

        @NonNull
        public Builder desc(@Nullable String desc) {
            this.desc = desc;
            return this;
        }

        @NonNull
        public Item build() {
            return new Item(this);
        }
    }
}
