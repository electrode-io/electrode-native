# swagger-android-client

## Requirements

Building the API client library requires [Maven](https://maven.apache.org/) to be installed.

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
import io.swagger.client.api.PetApi;

public class PetApiExample {

    public static void main(String[] args) {
        PetApi apiInstance = new PetApi();
        Long petId = 789L; // Long | ID of pet to update
        try {
            apiInstance.fireEvent(petId);
        } catch (ApiException e) {
            System.err.println("Exception when calling PetApi#fireEvent");
            e.printStackTrace();
        }
    }
}
```

## Documentation for API Endpoints

All URIs are relative to *https://localhost*

Class | Method | Type request | Description
------------ | ------------- | ------------- | -------------
*PetApi* | [**fireEvent**](docs/PetApi.md#fireEvent) |event| 

## Documentation for Models


## Author



