package com.walmartlabs.ern.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.getNumberValue;

public class Category implements Parcelable, Bridgeable {

    private Long id;
    private String name;

    private Category() {}

    private Category(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
    }

    private Category(Parcel in) {
        this(in.readBundle());
    }

    public Category(@NonNull Bundle bundle) {
        this.name = bundle.getString("name");
    }

    public static final Creator<Category> CREATOR = new Creator<Category>() {
        @Override
        public Category createFromParcel(Parcel in) {
            return new Category(in);
        }

        @Override
        public Category[] newArray(int size) {
            return new Category[size];
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
        public Category build() {
            return new Category(this);
        }
    }
}
