package com.walmartlabs.ern.api;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;
import com.walmartlabs.ern.model.User;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.getNumberValue;

public class UpdateUserData implements Parcelable, Bridgeable {

    private String username;
    private User body;

    private UpdateUserData() {}

    private UpdateUserData(Builder builder) {
        this.username = builder.username;
        this.body = builder.body;
    }

    private UpdateUserData(Parcel in) {
        this(in.readBundle());
    }

    public UpdateUserData(@NonNull Bundle bundle) {
        if(bundle.get("username") == null){
            throw new IllegalArgumentException("username property is required");
        }

        this.username = bundle.getString("username");
        this.body = bundle.containsKey("body") ? new User(bundle.getBundle("body")) : null;
    }

    public static final Creator<UpdateUserData> CREATOR = new Creator<UpdateUserData>() {
        @Override
        public UpdateUserData createFromParcel(Parcel in) {
            return new UpdateUserData(in);
        }

        @Override
        public UpdateUserData[] newArray(int size) {
            return new UpdateUserData[size];
        }
    };

    /**
    * name that need to be deleted
    *
    * @return String
    */
    @NonNull
    public String getusername() {
        return username;
    }

    /**
    * Updated user object
    *
    * @return User
    */
    @Nullable
    public User getbody() {
        return body;
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
        this.username = bundle.getString("username");
        if(body != null) {
            this.body = bundle.containsKey("body") ? new User(bundle.getBundle("body")) : null;
        }
        return bundle;
    }

    public static class Builder {
        private final String username;
        private User body;

        public Builder(@NonNull String username) {
            this.username = username;
        }

        @NonNull
        public Builder body(@Nullable User body) {
            this.body = body;
            return this;
        }

        @NonNull
        public UpdateUserData build() {
            return new UpdateUserData(this);
        }
    }
}