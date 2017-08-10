# swagger-android-client

## Requirements

Building the API client library requires [Maven](https://maven.apache.org/) to be installed.

## Installation

To install the API client library to your local Maven repository, simply execute:

```shell
mvn install
```

To deploy it to a remote Maven repository instead, configure the settings of the repository and execute:

```shell
mvn deploy
```

Refer to the [official documentation](https://maven.apache.org/plugins/maven-deploy-plugin/usage.html) for more information.

### Maven users

Add this dependency to your project's POM:

```xml
<dependency>
    <groupId>io.swagger</groupId>
    <artifactId>swagger-android-client</artifactId>
    <version>1.0.0</version>
    <scope>compile</scope>
</dependency>
```

### Gradle users

Add this dependency to your project's build file:

```groovy
compile "io.swagger:swagger-android-client:1.0.0"
```

### Others

At first generate the JAR by executing:

    mvn package

Then manually install the following JARs:

* target/swagger-android-client-1.0.0.jar
* target/lib/*.jar

## Getting Started

Please follow the [installation](#installation) instruction and execute the following Java code:

```java
import io.swagger.client.api.EstimatesApi;

public class EstimatesApiExample {

    public static void main(String[] args) {
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
    }
}
```

## Documentation for API Endpoints

All URIs are relative to *https://api.uber.com/v1*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*EstimatesApi* | [**estimatesPriceGet**](docs/EstimatesApi.md#estimatesPriceGet) | **GET** /estimates/price | Price Estimates
*EstimatesApi* | [**estimatesTimeGet**](docs/EstimatesApi.md#estimatesTimeGet) | **GET** /estimates/time | Time Estimates
*ProductsApi* | [**productsGet**](docs/ProductsApi.md#productsGet) | **GET** /products | Product Types
*UserApi* | [**historyGet**](docs/UserApi.md#historyGet) | **GET** /history | User Activity
*UserApi* | [**meGet**](docs/UserApi.md#meGet) | **GET** /me | User Profile

## Documentation for Models

 - [Activities](docs/Activities.md)
 - [Activity](docs/Activity.md)
 - [Error](docs/Error.md)
 - [PriceEstimate](docs/PriceEstimate.md)
 - [Product](docs/Product.md)
 - [Profile](docs/Profile.md)

## Documentation for Authorization

All endpoints do not require authorization.
Authentication schemes defined for the API:

## Recommendation

It's recommended to create an instance of `ApiClient` per thread in a multithreaded environment to avoid any potential issue.

## Author



