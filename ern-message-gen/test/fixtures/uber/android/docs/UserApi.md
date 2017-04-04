
# UserApi

All URIs are relative to *https://api.uber.com/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**historyGet**](UserApi.md#historyGet) | **GET** /history | User Activity
[**meGet**](UserApi.md#meGet) | **GET** /me | User Profile

<a name="historyGet"></a>
# **historyGet**
> Activities historyGet(offset, limit)

User Activity

The User Activity endpoint returns data about a user&#39;s lifetime activity with Uber. The response will include pickup locations and times, dropoff locations and times, the distance of past requests, and information about which products were requested.&lt;br&gt;&lt;br&gt;The history array in the response will have a maximum length based on the limit parameter. The response value count may exceed limit, therefore subsequent API requests may be necessary.

### Example
```java
// Import classes:
//import io.swagger.client.api.UserApi;

UserApi apiInstance = new UserApi();
Integer offset = 56; // Integer | Offset the list of returned results by this amount. Default is zero.
Integer limit = 56; // Integer | Number of items to retrieve. Default is 5, maximum is 100.
try {
    Activities result = apiInstance.historyGet(offset, limit);
    System.out.println(result);
} catch (ApiException e) {
    System.err.println("Exception when calling UserApi#historyGet");
    e.printStackTrace();
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **offset** | **Integer**| Offset the list of returned results by this amount. Default is zero. | [optional]
 **limit** | **Integer**| Number of items to retrieve. Default is 5, maximum is 100. | [optional]



### Return type

[**Activities**](Activities.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a name="meGet"></a>
# **meGet**
> Profile meGet()

User Profile

The User Profile endpoint returns information about the Uber user that has authorized with the application.

### Example
```java
// Import classes:
//import io.swagger.client.api.UserApi;

UserApi apiInstance = new UserApi();
try {
    Profile result = apiInstance.meGet();
    System.out.println(result);
} catch (ApiException e) {
    System.err.println("Exception when calling UserApi#meGet");
    e.printStackTrace();
}
```

### Parameters
This endpoint does not need any parameter.



### Return type

[**Profile**](Profile.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

