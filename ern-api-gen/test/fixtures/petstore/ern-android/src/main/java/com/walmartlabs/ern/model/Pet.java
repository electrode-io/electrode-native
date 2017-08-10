package com.walmartlabs.ern.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.getNumberValue;

public class Pet implements Parcelable, Bridgeable {

    private Long id;
    private Category category;
    private String name;
    private List<String> photoUrls;
    private List<Tag> tags;
    private String status;

    private Pet() {}

    private Pet(Builder builder) {
        this.id = builder.id;
        this.category = builder.category;
        this.name = builder.name;
        this.photoUrls = builder.photoUrls;
        this.tags = builder.tags;
        this.status = builder.status;
    }

    private Pet(Parcel in) {
        this(in.readBundle());
    }

    public Pet(@NonNull Bundle bundle) {
        this.category = bundle.containsKey("category") ? new Category(bundle.getBundle("category")) : null;
        this.name = bundle.getString("name");
        this.tags = bundle.containsKey("tags") ? new List<Tag>(bundle.getBundle("tags")) : null;
        this.status = bundle.getString("status");
    }

    public static final Creator<Pet> CREATOR = new Creator<Pet>() {
        @Override
        public Pet createFromParcel(Parcel in) {
            return new Pet(in);
        }

        @Override
        public Pet[] newArray(int size) {
            return new Pet[size];
        }
    };

    @Nullable
    public Long getId() {
        return id;
    }

    @Nullable
    public Category getCategory() {
        return category;
    }

    @Nullable
    public String getName() {
        return name;
    }

    @Nullable
    public List<String> getPhotoUrls() {
        return photoUrls;
    }

    @Nullable
    public List<Tag> getTags() {
        return tags;
    }

    /**
    * pet status in the store
    *
    * @return String
    */
    @Nullable
    public String getStatus() {
        return status;
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
        if(category != null) {
            this.category = bundle.containsKey("category") ? new Category(bundle.getBundle("category")) : null;
        }
        if(name != null) {
            this.name = bundle.getString("name");
        }
        if(tags != null) {
            this.tags = bundle.containsKey("tags") ? new List<Tag>(bundle.getBundle("tags")) : null;
        }
        if(status != null) {
            this.status = bundle.getString("status");
        }
        return bundle;
    }

    public static class Builder {
        private Long id;
        private Category category;
        private String name;
        private List<String> photoUrls;
        private List<Tag> tags;
        private String status;

        public Builder() {
        }

        @NonNull
        public Builder id(@Nullable Long id) {
            this.id = id;
            return this;
        }
        @NonNull
        public Builder category(@Nullable Category category) {
            this.category = category;
            return this;
        }
        @NonNull
        public Builder name(@Nullable String name) {
            this.name = name;
            return this;
        }
        @NonNull
        public Builder photoUrls(@Nullable List<String> photoUrls) {
            this.photoUrls = photoUrls;
            return this;
        }
        @NonNull
        public Builder tags(@Nullable List<Tag> tags) {
            this.tags = tags;
            return this;
        }
        @NonNull
        public Builder status(@Nullable String status) {
            this.status = status;
            return this;
        }

        @NonNull
        public Pet build() {
            return new Pet(this);
        }
    }
}
