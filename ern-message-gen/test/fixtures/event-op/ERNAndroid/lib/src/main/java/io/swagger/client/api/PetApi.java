package io.swagger.client.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import java.util.*;

public final class PetApi {
    private static final Requests REQUESTS;
    private static final Events EVENTS;

    static {
        REQUESTS = new PetRequests();
        EVENTS = new PetEvents();
    }

    private PetApi() {
    }

    @NonNull
    public static Requests requests() {
        return REQUESTS;
    }

    @NonNull
    public static Events events() {
        return EVENTS;
    }

    public interface Events {
        String EVENT_FIRE_EVENT = "io.swagger.client.api.event.fireEvent";

        void addFireEventEventListener(@NonNull final ElectrodeBridgeEventListener<Long> eventListener);

        void emitFireEvent(@NonNull Long petId);

    }

    public interface Requests {


    }
}