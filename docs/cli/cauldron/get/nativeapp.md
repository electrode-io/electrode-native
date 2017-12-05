## `ern cauldron get nativeapp`

#### Description

* Retrieve the data stored in the Cauldron for a given native application object
* Log the data as a JSON formatted string in your terminal

#### Syntax

`ern cauldron get nativeapp [descriptor]`  

**Options**

`descriptor`

* A partial or complete application descriptor representing which native application object to get
* If not provided, the command will log the list of all complete native application descriptors stored in the Cauldron

**Examples**
e
* `ern cauldron get nativeapp`

Will log all the complete native application descriptors from the Cauldron.
For example, here is a possible output :

```
walmart:android:17.7.0
walmart:android:17.8.0
walmart:ios:17.7.0
walmart:ios:17.8.0
testapp:android:1.0.0
```

* `ern cauldron get nativeapp walmart`

Will log the JSON document associated to the walmart application.

* `ern cauldron get nativeapp walmart:android`

Will log the JSON document associated to the walmart android application.

* `ern cauldron get nativeapp walmart:android:17.7.0`

Will log the JSON document associated to version 17.7.0 of the walmart android application.
____
