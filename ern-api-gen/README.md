## ERN API Generator

**!! Only supports Android/JS generation as of now !!**

This project can be used either as a standalone binary `ern-apigen` that can be launched from the command line, or it can be imported as a node module in another node project ([ern-local-cli](../ern-local-cli) is consuming it this way).

This project is making use of [mustache](https://mustache.github.io/) for templating needs.

It can be used to generate complete API & API Client code from a simple schema (or config).
API/APIClient code is wrapping all calls to `react-native-electrode-bridge` and offer clean typed (Android/iOS) methods to either consume or implement the API.  
Produced code is packaged in an npm module containing the Android/IOS and JS code. It has somehow a structure similar to any other react-native plugin.  

##### I/O

**Inputs**

Inputs are still WIP and subject to heavy changes in the way they are provided, but for now inputs can be either part of a config file or a schema. The schema will be converted to a config, so the basic unit of
input is a config.

Base config parameters :

| Name         | Description       | Required    | Default Value
|:----------:|:-------------:|:-------------:|:-------------:|
| namespace | The namespace/groupid to use for generated API| YES |  |
| modelPath | The path to the models to  use | No | | |

As of now the API generator looks for a file named `apigen.schema` in the working folder where the command is launched. The file represents the schema defining the API and is used during generation.

Here is an example of such a schema. Ultimately schema should also contains message types (data types) as the api generator will also probably take care of calling the message generator to fully generate the API including data types.

```json
{
  "swaggerVersion": "1.2",
  "apis": [
    {
      "path": "/hello/{subject}",
      "operations": [
        {
          "method": "GET",
          "summary": "Greet our subject with hello!",
          "type": "string",
          "nickname": "helloSubject",
          "parameters": [
            {
              "name": "subject",
              "description": "The subject to be greeted.",
              "required": true,
              "type": "string",
              "paramType": "path"
            }
          ]
        }
      ]
    }
  ],
  "models": {}
}  
```

`event` generation support is complete.
`request` generation support is partial (sufficient for demo app needs).
(Multi param request support is missing)


Generated code somehow reflect what has been proposed on the wiki :  
[Messages-API-generation-proposal](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/site/wiki/Messages-API-generation-proposal)

The [sample](./sample) folder let you see what gets generated based on a sample schema.


##### Current suggested development procedure

If you need to add new support or modify existing generating code, on Android a good way is to load the sample project in Android Studio and work from there to modify the Android code the way you would like the generated output to be.   
Then once you are satisfied and you ensure it compiles fine, you can backtrack from there and work on the template itself to produce the desired code.  
You can then run the generator and make sure produced code is correct by reloading the sample project in Android Studio and launching a new build.
