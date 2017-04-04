# UberApi.PriceEstimate

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**productId** | **String** | Unique identifier representing a specific product for a given latitude &amp; longitude. For example, uberX in San Francisco will have a different product_id than uberX in Los Angeles | [optional] 
**currencyCode** | **String** | [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217) currency code. | [optional] 
**displayName** | **String** | Display name of product. | [optional] 
**estimate** | **String** | Formatted string of estimate in local currency of the start location. Estimate could be a range, a single number (flat rate) or &quot;Metered&quot; for TAXI. | [optional] 
**lowEstimate** | **Number** | Lower bound of the estimated price. | [optional] 
**highEstimate** | **Number** | Upper bound of the estimated price. | [optional] 
**surgeMultiplier** | **Number** | Expected surge multiplier. Surge is active if surge_multiplier is greater than 1. Price estimate already factors in the surge multiplier. | [optional] 
