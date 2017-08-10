# UberApi.UserApi

All URIs are relative to *https://api.uber.com/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**historyGet**](UserApi.md#historyGet) | **GET** /history | User Activity
[**meGet**](UserApi.md#meGet) | **GET** /me | User Profile

<a name="historyGet"></a>
# **historyGet**
> Activities historyGet(opts)

User Activity

The User Activity endpoint returns data about a user&#39;s lifetime activity with Uber. The response will include pickup locations and times, dropoff locations and times, the distance of past requests, and information about which products were requested.&lt;br&gt;&lt;br&gt;The history array in the response will have a maximum length based on the limit parameter. The response value count may exceed limit, therefore subsequent API requests may be necessary.

### Example
```javascript
var UberApi = require('uber_api');

var apiInstance = new UberApi.UserApi();
var opts = { 
  'offset': 56, // Integer | Offset the list of returned results by this amount. Default is zero.
  'limit': 56 // Integer | Number of items to retrieve. Default is 5, maximum is 100.
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.historyGet(opts, callback);
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
```javascript
var UberApi = require('uber_api');

var apiInstance = new UberApi.UserApi();
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.meGet(callback);
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

