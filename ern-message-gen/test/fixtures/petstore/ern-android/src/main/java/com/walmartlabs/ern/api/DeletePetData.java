package com.walmartlabs.ern.api;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.getNumberValue;

public class DeletePetData implements Parcelable, Bridgeable {

    private Long petId;
    private String api_key;

    private DeletePetData() {}

    private DeletePetData(Builder builder) {
        this.petId = builder.petId;
        this.api_key = builder.api_key;
    }

    private DeletePetData(Parcel in) {
        this(in.readBundle());
    }

    public DeletePetData(@NonNull Bundle bundle) {
        if(bundle.get("petId") == null){
            throw new IllegalArgumentException("petId property is required");
        }

        this.api_key = bundle.getString("api_key");
    }

    public static final Creator<DeletePetData> CREATOR = new Creator<DeletePetData>() {
        @Override
        public DeletePetData createFromParcel(Parcel in) {
            return new DeletePetData(in);
        }

        @Override
        public DeletePetData[] newArray(int size) {
            return new DeletePetData[size];
        }
    };

    /**
    * Pet id to delete
    *
    * @return Long
    */
    @NonNull
    public Long getpetId() {
        return petId;
    }

    @Nullable
    public String getapi_key() {
        return api_key;
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
        if(api_key != null) {
            this.api_key = bundle.getString("api_key");
        }
        return bundle;
    }

    public static class Builder {
        private final Long petId;
        private String api_key;

        public Builder(@NonNull Long petId) {
            this.petId = petId;
        }

        @NonNull
        public Builder api_key(@Nullable String api_key) {
            this.api_key = api_key;
            return this;
        }

        @NonNull
        public DeletePetData build() {
            return new DeletePetData(this);
        }
    }
}