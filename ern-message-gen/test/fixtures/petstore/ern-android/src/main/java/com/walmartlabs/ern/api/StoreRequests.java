package com.walmartlabs.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.electrode.reactnative.bridge.RequestHandlerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.RequestProcessor;
import java.util.*;
import com.walmartlabs.ern.model.Order;
import java.util.Map;


final class StoreRequests implements StoreApi.Requests {
    StoreRequests() {}

    @Override
    public void registerDeleteOrderRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, None> handler) {
        new RequestHandlerProcessor<>(REQUEST_DELETE_ORDER, String.class, None.class, handler).execute();
    }
    @Override
    public void registerGetInventoryRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, Map<String, Integer>> handler) {
        new RequestHandlerProcessor<>(REQUEST_GET_INVENTORY, None.class, Map<String, Integer>.class, handler).execute();
    }
    @Override
    public void registerGetOrderByIdRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, Order> handler) {
        new RequestHandlerProcessor<>(REQUEST_GET_ORDER_BY_ID, String.class, Order.class, handler).execute();
    }
    @Override
    public void registerPlaceOrderRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<Order, Order> handler) {
        new RequestHandlerProcessor<>(REQUEST_PLACE_ORDER, Order.class, Order.class, handler).execute();
    }

    //------------------------------------------------------------------------------------------------------------------------------------

    @Override
    public void deleteOrder(String orderId,@NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
        new RequestProcessor<>(REQUEST_DELETE_ORDER, null, None.class, responseListener).execute();
    }
    @Override
    public void getInventory(@NonNull final ElectrodeBridgeResponseListener<Map<String, Integer>> responseListener) {
        new RequestProcessor<>(REQUEST_GET_INVENTORY, null, Map<String, Integer>.class, responseListener).execute();
    }
    @Override
    public void getOrderById(String orderId,@NonNull final ElectrodeBridgeResponseListener<Order> responseListener) {
        new RequestProcessor<>(REQUEST_GET_ORDER_BY_ID, null, Order.class, responseListener).execute();
    }
    @Override
    public void placeOrder(Order body,@NonNull final ElectrodeBridgeResponseListener<Order> responseListener) {
        new RequestProcessor<>(REQUEST_PLACE_ORDER, null, Order.class, responseListener).execute();
    }
}