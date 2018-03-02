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

public class NavBarButton implements Parcelable, Bridgeable {

    private String name;
    private String identifier;
    private Boolean showIcon;

    private NavBarButton() {}

    private NavBarButton(Builder builder) {
        this.name = builder.name;
        this.identifier = builder.identifier;
        this.showIcon = builder.showIcon;
    }

    private NavBarButton(Parcel in) {
        this(in.readBundle());
    }

    public NavBarButton(@NonNull Bundle bundle) {
        if(!bundle.containsKey("name")){
            throw new IllegalArgumentException("name property is required");
        }

        if(!bundle.containsKey("identifier")){
            throw new IllegalArgumentException("identifier property is required");
        }

        this.name = bundle.getString("name");
        this.identifier = bundle.getString("identifier");
        this.showIcon = bundle.containsKey("showIcon") ? bundle.getBoolean("showIcon") : null;
    }

    public static final Creator<NavBarButton> CREATOR = new Creator<NavBarButton>() {
        @Override
        public NavBarButton createFromParcel(Parcel in) {
            return new NavBarButton(in);
        }

        @Override
        public NavBarButton[] newArray(int size) {
            return new NavBarButton[size];
        }
    };

    /**
    * Name of button
    *
    * @return String
    */
    @NonNull
    public String getName() {
        return name;
    }

    /**
    * Id of the button
    *
    * @return String
    */
    @NonNull
    public String getIdentifier() {
        return identifier;
    }

    /**
    * Set to true for showing icon
    *
    * @return Boolean
    */
    @Nullable
    public Boolean getShowIcon() {
        return showIcon;
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
        bundle.putString("identifier", this.identifier);
        if(this.showIcon != null) {
            bundle.putBoolean("showIcon", this.showIcon);
        }
        return bundle;
    }

    @Override
    public String toString() {
        return "{"
        + "name:" + (name != null ? "\"" + name + "\"" : null)+ ","
        + "identifier:" + (identifier != null ? "\"" + identifier + "\"" : null)+ ","
        + "showIcon:" + showIcon
        + "}";
    }

    public static class Builder {
        private final String name;
        private final String identifier;
        private Boolean showIcon;

        public Builder(@NonNull String name, @NonNull String identifier) {
            this.name = name;
            this.identifier = identifier;
        }

        @NonNull
        public Builder showIcon(@Nullable Boolean showIcon) {
            this.showIcon = showIcon;
            return this;
        }

        @NonNull
        public NavBarButton build() {
            return new NavBarButton(this);
        }
    }
}
