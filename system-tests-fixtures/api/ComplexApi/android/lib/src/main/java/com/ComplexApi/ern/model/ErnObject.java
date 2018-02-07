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

package com.ComplexApi.ern.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import java.util.List;

import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.*;

public class ErnObject implements Parcelable, Bridgeable {

    private String name;
    private String value;
    private String domain;
    private String path;
    private String uri;
    private Double version;
    private Long expiry;
    private NavBarButton leftButton;
    private List<NavBarButton> rightButtons;
    private Boolean isGuestUser;
    private Integer mergeType;

    private ErnObject() {}

    private ErnObject(Builder builder) {
        this.name = builder.name;
        this.value = builder.value;
        this.domain = builder.domain;
        this.path = builder.path;
        this.uri = builder.uri;
        this.version = builder.version;
        this.expiry = builder.expiry;
        this.leftButton = builder.leftButton;
        this.rightButtons = builder.rightButtons;
        this.isGuestUser = builder.isGuestUser;
        this.mergeType = builder.mergeType;
    }

    private ErnObject(Parcel in) {
        this(in.readBundle());
    }

    public ErnObject(@NonNull Bundle bundle) {
        if(!bundle.containsKey("name")){
            throw new IllegalArgumentException("name property is required");
        }

        if(!bundle.containsKey("version")){
            throw new IllegalArgumentException("version property is required");
        }

        this.name = bundle.getString("name");
        this.value = bundle.getString("value");
        this.domain = bundle.getString("domain");
        this.path = bundle.getString("path");
        this.uri = bundle.getString("uri");
        this.version = bundle.getDouble("version");
        this.expiry = getNumberValue(bundle, "expiry") == null ? null : getNumberValue(bundle, "expiry").longValue();
        this.leftButton = bundle.containsKey("leftButton") ? new NavBarButton(bundle.getBundle("leftButton")) : null;
        this.rightButtons = bundle.containsKey("rightButtons") ? getList(bundle.getParcelableArray("rightButtons"), NavBarButton.class) : null;
        this.isGuestUser = bundle.containsKey("isGuestUser") ? bundle.getBoolean("isGuestUser") : null;
        this.mergeType = getNumberValue(bundle, "mergeType") == null ? null : getNumberValue(bundle, "mergeType").intValue();
    }

    public static final Creator<ErnObject> CREATOR = new Creator<ErnObject>() {
        @Override
        public ErnObject createFromParcel(Parcel in) {
            return new ErnObject(in);
        }

        @Override
        public ErnObject[] newArray(int size) {
            return new ErnObject[size];
        }
    };

    @NonNull
    public String getName() {
        return name;
    }

    @Nullable
    public String getValue() {
        return value;
    }

    @Nullable
    public String getDomain() {
        return domain;
    }

    @Nullable
    public String getPath() {
        return path;
    }

    @Nullable
    public String getUri() {
        return uri;
    }

    @NonNull
    public Double getVersion() {
        return version;
    }

    @Nullable
    public Long getExpiry() {
        return expiry;
    }

    @Nullable
    public NavBarButton getLeftButton() {
        return leftButton;
    }

    /**
    * Right button properties
    *
    * @return List<NavBarButton>
    */
    @Nullable
    public List<NavBarButton> getRightButtons() {
        return rightButtons;
    }

    /**
    * specify if user is a guest
    *
    * @return Boolean
    */
    @Nullable
    public Boolean getIsGuestUser() {
        return isGuestUser;
    }

    /**
    * specify merge type
    *
    * @return Integer
    */
    @Nullable
    public Integer getMergeType() {
        return mergeType;
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
        bundle.putString("name", this.name);
        bundle.putDouble("version", this.version);
        if(value != null) {
            bundle.putString("value", this.value );
        }
        if(domain != null) {
            bundle.putString("domain", this.domain );
        }
        if(path != null) {
            bundle.putString("path", this.path );
        }
        if(uri != null) {
            bundle.putString("uri", this.uri );
        }
        if(this.expiry != null) {
            bundle.putLong("expiry", this.expiry);
        }
        if(this.leftButton != null) {
            bundle.putBundle("leftButton", this.leftButton.toBundle());
        }
        if(this.rightButtons != null) {
            updateBundleWithList(this.rightButtons, bundle, "rightButtons");
        }
        if(this.isGuestUser != null) {
            bundle.putBoolean("isGuestUser", this.isGuestUser);
        }
        if(this.mergeType != null) {
            bundle.putInt("mergeType", this.mergeType);
        }
        return bundle;
    }

    @Override
    public String toString() {
        return "{"
        + "name:" + (name != null ? "\"" + name + "\"" : null)+ ","
        + "value:" + (value != null ? "\"" + value + "\"" : null)+ ","
        + "domain:" + (domain != null ? "\"" + domain + "\"" : null)+ ","
        + "path:" + (path != null ? "\"" + path + "\"" : null)+ ","
        + "uri:" + (uri != null ? "\"" + uri + "\"" : null)+ ","
        + "version:" + version+ ","
        + "expiry:" + expiry+ ","
        + "leftButton:" + (leftButton != null ? leftButton.toString() : null)+ ","
        + "rightButtons:" + (rightButtons != null ? rightButtons.toString() : null)+ ","
        + "isGuestUser:" + isGuestUser+ ","
        + "mergeType:" + mergeType
        + "}";
    }

    public static class Builder {
        private final String name;
        private final Double version;
        private String value;
        private String domain;
        private String path;
        private String uri;
        private Long expiry;
        private NavBarButton leftButton;
        private List<NavBarButton> rightButtons;
        private Boolean isGuestUser;
        private Integer mergeType;

        public Builder(@NonNull String name, @NonNull Double version) {
            this.name = name;
            this.version = version;
        }

        @NonNull
        public Builder value(@Nullable String value) {
            this.value = value;
            return this;
        }
        @NonNull
        public Builder domain(@Nullable String domain) {
            this.domain = domain;
            return this;
        }
        @NonNull
        public Builder path(@Nullable String path) {
            this.path = path;
            return this;
        }
        @NonNull
        public Builder uri(@Nullable String uri) {
            this.uri = uri;
            return this;
        }
        @NonNull
        public Builder expiry(@Nullable Long expiry) {
            this.expiry = expiry;
            return this;
        }
        @NonNull
        public Builder leftButton(@Nullable NavBarButton leftButton) {
            this.leftButton = leftButton;
            return this;
        }
        @NonNull
        public Builder rightButtons(@Nullable List<NavBarButton> rightButtons) {
            this.rightButtons = rightButtons;
            return this;
        }
        @NonNull
        public Builder isGuestUser(@Nullable Boolean isGuestUser) {
            this.isGuestUser = isGuestUser;
            return this;
        }
        @NonNull
        public Builder mergeType(@Nullable Integer mergeType) {
            this.mergeType = mergeType;
            return this;
        }

        @NonNull
        public ErnObject build() {
            return new ErnObject(this);
        }
    }
}
