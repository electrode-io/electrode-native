package com.withargs.ern.withargs.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

public class LatLng implements Parcelable {

    private static final String KEY_BUNDLE_ID = "latLng";
    private static final String VALUE_BUNDLE_ID = LatLng.class.getCanonicalName();

    @Nullable
    public static LatLng fromBundle(@Nullable Bundle bundle) {
        if (bundle == null) {
            return null;
        }

        if (!bundle.containsKey(KEY_BUNDLE_ID)
                || !(VALUE_BUNDLE_ID).equals(bundle.getString(KEY_BUNDLE_ID))) {
            return null;
        }


        Builder builder = new Builder();
        builder.lat(bundle.containsKey("lat") ? bundle.getInt("lat") : null);
        builder.lng(bundle.containsKey("lng") ? bundle.getInt("lng") : null);
        builder.name(bundle.containsKey("name") ? bundle.getString("name") : null);
        return builder.build();
    }

    private final Integer lat;
    private final Integer lng;
    private final String name;

    private LatLng(Builder builder) {
        this.lat = builder.lat;
        this.lng = builder.lng;
        this.name = builder.name;
    }

    private LatLng(Parcel in) {
        Bundle bundle = in.readBundle();
        this.lat = bundle.containsKey("lat") ? bundle.getInt("lat") : null;
        this.lng = bundle.containsKey("lng") ? bundle.getInt("lng") : null;
        this.name = bundle.containsKey("name") ? bundle.getString("name") : null;
    }

    public static final Creator<LatLng> CREATOR = new Creator<LatLng>() {
        @Override
        public LatLng createFromParcel(Parcel in) {
            return new LatLng(in);
        }

        @Override
        public LatLng[] newArray(int size) {
            return new LatLng[size];
        }
    };

    @Nullable
    public Integer getLat() {
        return lat;
    }

    @Nullable
    public Integer getLng() {
        return lng;
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
    public Bundle toBundle() {
        Bundle bundle = new Bundle();
        if(lat != null) {
            bundle.putInt("lat", lat);
        }
        if(lng != null) {
            bundle.putInt("lng", lng);
        }
        if(name != null) {
            bundle.putString("name", name);
        }
        bundle.putString(KEY_BUNDLE_ID, VALUE_BUNDLE_ID);
        return bundle;
    }

    public static class Builder {
        private Integer lat;
        private Integer lng;
        private String name;

        public Builder() {
        }

        @NonNull
        public Builder lat(@Nullable Integer lat) {
            this.lat = lat;
            return this;
        }

        @NonNull
        public Builder lng(@Nullable Integer lng) {
            this.lng = lng;
            return this;
        }

        @NonNull
        public Builder name(@Nullable String name) {
            this.name = name;
            return this;
        }

        @NonNull
        public LatLng build() {
            return new LatLng(this);
        }
    }
}
