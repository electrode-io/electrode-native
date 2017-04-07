package com.walmartlabs.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import java.util.*;
import com.walmartlabs.ern.model.Order;
import java.util.Map;

public final class StoreApi {
    private static final Requests REQUESTS;

    static {
        REQUESTS = new StoreRequests();
    }

    private StoreApi() {
    }

    @NonNull
    public static Requests requests() {
        return REQUESTS;
    }



    public interface Requests {
        String REQUEST_DELETE_ORDER = "com.walmartlabs.ern.api.request.deleteOrder";
        String REQUEST_GET_INVENTORY = "com.walmartlabs.ern.api.request.getInventory";
        String REQUEST_GET_ORDER_BY_ID = "com.walmartlabs.ern.api.request.getOrderById";
        String REQUEST_PLACE_ORDER = "com.walmartlabs.ern.api.request.placeOrder";


        void registerDeleteOrderRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, None> handler);

        void registerGetInventoryRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, Map<String, Integer>> handler);

        void registerGetOrderByIdRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, Order> handler);

        void registerPlaceOrderRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<Order, Order> handler);

        void deleteOrder(String orderId, @NonNull final ElectrodeBridgeResponseListener<None> responseListener);

        void getInventory(@NonNull final ElectrodeBridgeResponseListener<Map<String, Integer>> responseListener);

        void getOrderById(String orderId, @NonNull final ElectrodeBridgeResponseListener<Order> responseListener);

        void placeOrder(Order body, @NonNull final ElectrodeBridgeResponseListener<Order> responseListener);

    }
}