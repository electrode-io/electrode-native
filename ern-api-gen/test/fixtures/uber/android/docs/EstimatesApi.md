
# EstimatesApi

All URIs are relative to *https://api.uber.com/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**estimatesPriceGet**](EstimatesApi.md#estimatesPriceGet) | **GET** /estimates/price | Price Estimates
[**estimatesTimeGet**](EstimatesApi.md#estimatesTimeGet) | **GET** /estimates/time | Time Estimates

<a name="estimatesPriceGet"></a>
# **estimatesPriceGet**
> List&lt;PriceEstimate&gt; estimatesPriceGet(startLatitude, startLongitude, endLatitude, endLongitude)

Price Estimates

The Price Estimates endpoint returns an estimated price range for each product offered at a given location. The price estimate is provided as a formatted string with the full price range and the localized currency symbol.&lt;br&gt;&lt;br&gt;The response also includes low and high estimates, and the [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217) currency code for situations requiring currency conversion. When surge is active for a particular product, its surge_multiplier will be greater than 1, but the price estimate already factors in this multiplier.

### Example
```java
// Import classes:
//import io.swagger.client.api.EstimatesApi;

EstimatesApi apiInstance = new EstimatesApi();
Double startLatitude = 3.4D; // Double | Latitude component of start location.
Double startLongitude = 3.4D; // Double | Longitude component of start location.
Double endLatitude = 3.4D; // Double | Latitude component of end location.
Double endLongitude = 3.4D; // Double | Longitude component of end location.
try {
    List<PriceEstimate> result = apiInstance.estimatesPriceGet(startLatitude, startLongitude, endLatitude, endLongitude);
    System.out.println(result);
} catch (ApiException e) {
    System.err.println("Exception when calling EstimatesApi#estimatesPriceGet");
    e.printStackTrace();
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **startLatitude** | **Double**| Latitude component of start location. |
 **startLongitude** | **Double**| Longitude component of start location. |
 **endLatitude** | **Double**| Latitude component of end location. |
 **endLongitude** | **Double**| Longitude component of end location. |



### Return type

[**List&lt;PriceEstimate&gt;**](PriceEstimate.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a name="estimatesTimeGet"></a>
# **estimatesTimeGet**
> List&lt;Product&gt; estimatesTimeGet(startLatitude, startLongitude, customerUuid, productId)

Time Estimates

The Time Estimates endpoint returns ETAs for all products offered at a given location, with the responses expressed as integers in seconds. We recommend that this endpoint be called every minute to provide the most accurate, up-to-date ETAs.

### Example
```java
// Import classes:
//import io.swagger.client.api.EstimatesApi;

EstimatesApi apiInstance = new EstimatesApi();
Double startLatitude = 3.4D; // Double | Latitude component of start location.
Double startLongitude = 3.4D; // Double | Longitude component of start location.
UUID customerUuid = new UUID(); // UUID | Unique customer identifier to be used for experience customization.
String productId = "productId_example"; // String | Unique identifier representing a specific product for a given latitude &amp; longitude.
try {
    List<Product> result = apiInstance.estimatesTimeGet(startLatitude, startLongitude, customerUuid, productId);
    System.out.println(result);
} catch (ApiException e) {
    System.err.println("Exception when calling EstimatesApi#estimatesTimeGet");
    e.printStackTrace();
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **startLatitude** | **Double**| Latitude component of start location. |
 **startLongitude** | **Double**| Longitude component of start location. |
 **customerUuid** | **UUID**| Unique customer identifier to be used for experience customization. | [optional]
 **productId** | **String**| Unique identifier representing a specific product for a given latitude &amp; longitude. | [optional]



### Return type

[**List&lt;Product&gt;**](Product.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

