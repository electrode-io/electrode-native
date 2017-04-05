package com.walmartlabs.ern.api;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.getNumberValue;

public class UpdatePetWithFormData implements Parcelable, Bridgeable {

    private String petId;
    private String name;
    private String status;

    private UpdatePetWithFormData() {}

    private UpdatePetWithFormData(Builder builder) {
        this.petId = builder.petId;
        this.name = builder.name;
        this.status = builder.status;
    }

    private UpdatePetWithFormData(Parcel in) {
        this(in.readBundle());
    }

    public UpdatePetWithFormData(@NonNull Bundle bundle) {
        if(bundle.get("petId") == null){
            throw new IllegalArgumentException("petId property is required");
        }

        this.petId = bundle.getString("petId");
        this.name = bundle.getString("name");
        this.status = bundle.getString("status");
    }

    public static final Creator<UpdatePetWithFormData> CREATOR = new Creator<UpdatePetWithFormData>() {
        @Override
        public UpdatePetWithFormData createFromParcel(Parcel in) {
            return new UpdatePetWithFormData(in);
        }

        @Override
        public UpdatePetWithFormData[] newArray(int size) {
            return new UpdatePetWithFormData[size];
        }
    };

    /**
    * ID of pet that needs to be updated
    *
    * @return String
    */
    @NonNull
    public String getpetId() {
        return petId;
    }

    /**
    * Updated name of the pet
    *
    * @return String
    */
    @Nullable
    public String getname() {
        return name;
    }

    /**
    * Updated status of the pet
    *
    * @return String
    */
    @Nullable
    public String getstatus() {
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
        this.petId = bundle.getString("petId");
        if(name != null) {
            this.name = bundle.getString("name");
        }
        if(status != null) {
            this.status = bundle.getString("status");
        }
        return bundle;
    }

    public static class Builder {
        private final String petId;
        private String name;
        private String status;

        public Builder(@NonNull String petId) {
            this.petId = petId;
        }

        @NonNull
        public Builder name(@Nullable String name) {
            this.name = name;
            return this;
        }
        @NonNull
        public Builder status(@Nullable String status) {
            this.status = status;
            return this;
        }

        @NonNull
        public UpdatePetWithFormData build() {
            return new UpdatePetWithFormData(this);
        }
    }
}