package io.swagger.client.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.EventListenerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.EventProcessor;
import com.walmartlabs.electrode.reactnative.bridge.None;
import java.util.*;


final class PetEvents implements PetApi.Events {
    PetEvents() {}

    @Override
    public void addFireEventEventListener(@NonNull final ElectrodeBridgeEventListener<Long> eventListener) {
        new EventListenerProcessor<>(EVENT_FIRE_EVENT, Long.class, eventListener).execute();
    }

    //------------------------------------------------------------------------------------------------------------------------------------

    @Override
    public void emitFireEvent(Long petId) {
        new EventProcessor<>(EVENT_FIRE_EVENT, petId).execute();
    }
}
