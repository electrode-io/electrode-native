package com.walmartlabs.ern.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.getNumberValue;

public class Order implements Parcelable, Bridgeable {

    private Long id;
    private Long petId;
    private Integer quantity;
    private String shipDate;
    private String status;
    private Boolean complete;

    private Order() {}

    private Order(Builder builder) {
        this.id = builder.id;
        this.petId = builder.petId;
        this.quantity = builder.quantity;
        this.shipDate = builder.shipDate;
        this.status = builder.status;
        this.complete = builder.complete;
    }

    private Order(Parcel in) {
        this(in.readBundle());
    }

    public Order(@NonNull Bundle bundle) {
        this.quantity = getNumberValue(bundle, "quantity") == null ? null : getNumberValue(bundle, "quantity").intValue();
        this.shipDate = bundle.getString("shipDate");
        this.status = bundle.getString("status");
        this.complete = bundle.containsKey("complete") ? bundle.getBoolean("complete") : null;
    }

    public static final Creator<Order> CREATOR = new Creator<Order>() {
        @Override
        public Order createFromParcel(Parcel in) {
            return new Order(in);
        }

        @Override
        public Order[] newArray(int size) {
            return new Order[size];
        }
    };

    @Nullable
    public Long getId() {
        return id;
    }

    @Nullable
    public Long getPetId() {
        return petId;
    }

    @Nullable
    public Integer getQuantity() {
        return quantity;
    }

    @Nullable
    public String getShipDate() {
        return shipDate;
    }

    /**
    * Order Status
    *
    * @return String
    */
    @Nullable
    public String getStatus() {
        return status;
    }

    @Nullable
    public Boolean getComplete() {
        return complete;
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
        if(quantity != null) {
            this.quantity = getNumberValue(bundle, "quantity") == null ? null : getNumberValue(bundle, "quantity").intValue();
        }
        if(shipDate != null) {
            this.shipDate = bundle.getString("shipDate");
        }
        if(status != null) {
            this.status = bundle.getString("status");
        }
        if(complete != null) {
            this.complete = bundle.containsKey("complete") ? bundle.getBoolean("complete") : null;
        }
        return bundle;
    }

    public static class Builder {
        private Long id;
        private Long petId;
        private Integer quantity;
        private String shipDate;
        private String status;
        private Boolean complete;

        public Builder() {
        }

        @NonNull
        public Builder id(@Nullable Long id) {
            this.id = id;
            return this;
        }
        @NonNull
        public Builder petId(@Nullable Long petId) {
            this.petId = petId;
            return this;
        }
        @NonNull
        public Builder quantity(@Nullable Integer quantity) {
            this.quantity = quantity;
            return this;
        }
        @NonNull
        public Builder shipDate(@Nullable String shipDate) {
            this.shipDate = shipDate;
            return this;
        }
        @NonNull
        public Builder status(@Nullable String status) {
            this.status = status;
            return this;
        }
        @NonNull
        public Builder complete(@Nullable Boolean complete) {
            this.complete = complete;
            return this;
        }

        @NonNull
        public Order build() {
            return new Order(this);
        }
    }
}
