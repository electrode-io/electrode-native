# UberApi.EstimatesApi

All URIs are relative to *https://api.uber.com/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**estimatesPriceGet**](EstimatesApi.md#estimatesPriceGet) | **GET** /estimates/price | Price Estimates
[**estimatesTimeGet**](EstimatesApi.md#estimatesTimeGet) | **GET** /estimates/time | Time Estimates

<a name="estimatesPriceGet"></a>
# **estimatesPriceGet**
> [PriceEstimate] estimatesPriceGet(startLatitude, startLongitude, endLatitude, endLongitude)

Price Estimates

The Price Estimates endpoint returns an estimated price range for each product offered at a given location. The price estimate is provided as a formatted string with the full price range and the localized currency symbol.&lt;br&gt;&lt;br&gt;The response also includes low and high estimates, and the [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217) currency code for situations requiring currency conversion. When surge is active for a particular product, its surge_multiplier will be greater than 1, but the price estimate already factors in this multiplier.

### Example
```javascript
var UberApi = require('uber_api');

var apiInstance = new UberApi.EstimatesApi();
var startLatitude = 1.2; // Number | Latitude component of start location.
var startLongitude = 1.2; // Number | Longitude component of start location.
var endLatitude = 1.2; // Number | Latitude component of end location.
var endLongitude = 1.2; // Number | Longitude component of end location.

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.estimatesPriceGet(startLatitude, startLongitude, endLatitude, endLongitude, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **startLatitude** | **Number**| Latitude component of start location. | 
 **startLongitude** | **Number**| Longitude component of start location. | 
 **endLatitude** | **Number**| Latitude component of end location. | 
 **endLongitude** | **Number**| Longitude component of end location. | 

### Return type

[**[PriceEstimate]**](PriceEstimate.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a name="estimatesTimeGet"></a>
# **estimatesTimeGet**
> [Product] estimatesTimeGet(startLatitude, startLongitude, opts)

Time Estimates

The Time Estimates endpoint returns ETAs for all products offered at a given location, with the responses expressed as integers in seconds. We recommend that this endpoint be called every minute to provide the most accurate, up-to-date ETAs.

### Example
```javascript
var UberApi = require('uber_api');

var apiInstance = new UberApi.EstimatesApi();
var startLatitude = 1.2; // Number | Latitude component of start location.
var startLongitude = 1.2; // Number | Longitude component of start location.
var opts = { 
  'customerUuid': "customerUuid_example", // String | Unique customer identifier to be used for experience customization.
  'productId': "productId_example" // String | Unique identifier representing a specific product for a given latitude &amp; longitude.
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.estimatesTimeGet(startLatitude, startLongitude, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **startLatitude** | **Number**| Latitude component of start location. | 
 **startLongitude** | **Number**| Longitude component of start location. | 
 **customerUuid** | **String**| Unique customer identifier to be used for experience customization. | [optional] 
 **productId** | **String**| Unique identifier representing a specific product for a given latitude &amp; longitude. | [optional] 

### Return type

[**[Product]**](Product.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

