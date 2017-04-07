package com.walmartlabs.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.electrode.reactnative.bridge.RequestHandlerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.RequestProcessor;
import java.util.*;
import com.walmartlabs.ern.model.User;
import java.util.*;


final class UserRequests implements UserApi.Requests {
    UserRequests() {}

    @Override
    public void registerCreateUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<User, None> handler) {
        new RequestHandlerProcessor<>(REQUEST_CREATE_USER, User.class, None.class, handler).execute();
    }
    @Override
    public void registerCreateUsersWithArrayInputRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<List<User>, None> handler) {
        new RequestHandlerProcessor<>(REQUEST_CREATE_USERS_WITH_ARRAY_INPUT, (Class) User.class, None.class, handler).execute();
    }
    @Override
    public void registerCreateUsersWithListInputRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<List<User>, None> handler) {
        new RequestHandlerProcessor<>(REQUEST_CREATE_USERS_WITH_LIST_INPUT, (Class) User.class, None.class, handler).execute();
    }
    @Override
    public void registerDeleteUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, None> handler) {
        new RequestHandlerProcessor<>(REQUEST_DELETE_USER, String.class, None.class, handler).execute();
    }
    @Override
    public void registerGetUserByNameRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, User> handler) {
        new RequestHandlerProcessor<>(REQUEST_GET_USER_BY_NAME, String.class, User.class, handler).execute();
    }
    @Override
    public void registerLoginUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<LoginUserData, String> handler) {
        new RequestHandlerProcessor<>(REQUEST_LOGIN_USER, LoginUserData.class, String.class, handler).execute();
    }
    @Override
    public void registerLogoutUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, None> handler) {
        new RequestHandlerProcessor<>(REQUEST_LOGOUT_USER, None.class, None.class, handler).execute();
    }
    @Override
    public void registerUpdateUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<UpdateUserData, None> handler) {
        new RequestHandlerProcessor<>(REQUEST_UPDATE_USER, UpdateUserData.class, None.class, handler).execute();
    }

    //------------------------------------------------------------------------------------------------------------------------------------

    @Override
    public void createUser(User body,@NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
        new RequestProcessor<>(REQUEST_CREATE_USER, null, None.class, responseListener).execute();
    }
    @Override
    public void createUsersWithArrayInput(List<User> body,@NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
        new RequestProcessor<>(REQUEST_CREATE_USERS_WITH_ARRAY_INPUT, null, None.class, responseListener).execute();
    }
    @Override
    public void createUsersWithListInput(List<User> body,@NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
        new RequestProcessor<>(REQUEST_CREATE_USERS_WITH_LIST_INPUT, null, None.class, responseListener).execute();
    }
    @Override
    public void deleteUser(String username,@NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
        new RequestProcessor<>(REQUEST_DELETE_USER, null, None.class, responseListener).execute();
    }
    @Override
    public void getUserByName(String username,@NonNull final ElectrodeBridgeResponseListener<User> responseListener) {
        new RequestProcessor<>(REQUEST_GET_USER_BY_NAME, null, User.class, responseListener).execute();
    }
    @Override
    public void loginUser(LoginUserData loginUserData,@NonNull final ElectrodeBridgeResponseListener<String> responseListener) {
        new RequestProcessor<>(REQUEST_LOGIN_USER, null, String.class, responseListener).execute();
    }
    @Override
    public void logoutUser(@NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
        new RequestProcessor<>(REQUEST_LOGOUT_USER, null, None.class, responseListener).execute();
    }
    @Override
    public void updateUser(UpdateUserData updateUserData,@NonNull final ElectrodeBridgeResponseListener<None> responseListener) {
        new RequestProcessor<>(REQUEST_UPDATE_USER, null, None.class, responseListener).execute();
    }
}