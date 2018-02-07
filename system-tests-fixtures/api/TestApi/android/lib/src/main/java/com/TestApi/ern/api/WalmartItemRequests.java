/*
* Copyright 2017 WalmartLabs
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* http://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

package com.TestApi.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.electrode.reactnative.bridge.RequestHandlerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.RequestProcessor;
import java.util.*;
import com.TestApi.ern.model.Item;


final class WalmartItemRequests implements WalmartItemApi.Requests {
    WalmartItemRequests() {}


    @Override
    public void registerAddItemRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<Item, Boolean> handler) {
        new RequestHandlerProcessor<>(REQUEST_ADD_ITEM, Item.class, Boolean.class, handler).execute();
    }

    @Override
    public void registerFindItemsRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<Integer, List<Item>> handler) {
        new RequestHandlerProcessor<>(REQUEST_FIND_ITEMS, Integer.class, (Class) Item.class, handler).execute();
    }

    //------------------------------------------------------------------------------------------------------------------------------------

    @Override
    public void addItem(Item item,@NonNull final ElectrodeBridgeResponseListener<Boolean> responseListener) {
        new RequestProcessor<>(REQUEST_ADD_ITEM,  item, Boolean.class, responseListener).execute();
    }
    @Override
    public void findItems(Integer limit,@NonNull final ElectrodeBridgeResponseListener<List<Item>> responseListener) {
        new RequestProcessor<>(REQUEST_FIND_ITEMS,  limit, (Class) List.class, Item.class, responseListener).execute();
    }
}