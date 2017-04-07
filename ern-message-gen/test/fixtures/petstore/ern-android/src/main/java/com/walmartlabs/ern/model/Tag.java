package com.walmartlabs.ern.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.getNumberValue;

public class Tag implements Parcelable, Bridgeable {

    private Long id;
    private String name;

    private Tag() {}

    private Tag(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
    }

    private Tag(Parcel in) {
        this(in.readBundle());
    }

    public Tag(@NonNull Bundle bundle) {
        this.name = bundle.getString("name");
    }

    public static final Creator<Tag> CREATOR = new Creator<Tag>() {
        @Override
        public Tag createFromParcel(Parcel in) {
            return new Tag(in);
        }

        @Override
        public Tag[] newArray(int size) {
            return new Tag[size];
        }
    };

    @Nullable
    public Long getId() {
        return id;
    }

    @Nullable
    public String getName() {
        return name;
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
        if(name != null) {
            this.name = bundle.getString("name");
        }
        return bundle;
    }

    public static class Builder {
        private Long id;
        private String name;

        public Builder() {
        }

        @NonNull
        public Builder id(@Nullable Long id) {
            this.id = id;
            return this;
        }
        @NonNull
        public Builder name(@Nullable String name) {
            this.name = name;
            return this;
        }

        @NonNull
        public Tag build() {
            return new Tag(this);
        }
    }
}
