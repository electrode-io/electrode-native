package com.walmartlabs.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.EventListenerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.EventProcessor;
import com.walmartlabs.electrode.reactnative.bridge.None;
import java.util.*;

    import com.walmartlabs.ern.model.Pet;

final class PetEvents implements PetApi.Events {
    PetEvents() {}

    @Override
    public void addImageUploadedEventListener(@NonNull final ElectrodeBridgeEventListener<Long> eventListener) {
        new EventListenerProcessor<>(EVENT_IMAGE_UPLOADED, Long.class, eventListener).execute();
    }

    //------------------------------------------------------------------------------------------------------------------------------------

    @Override
    public void emitImageUploaded(Long petId) {
        new EventProcessor<>(EVENT_IMAGE_UPLOADED, petId).execute();
    }
}
