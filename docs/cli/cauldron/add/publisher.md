## `ern cauldron add publisher`

### Description

* Add a githubUrl(ios or android) or a mavenUrl(android) as a publisher to cauldron config.
* Add a publisher when you want the generated container to be pushed to remote location.
* If a publisher config is not present, the containers will always be generated locally.

#### Syntax

###### Maven publisher
`ern cauldron add publisher --mavenUrl=<url>`

###### Github publisher
`ern cauldron add publisher --githubUrl=<url>`

**Options**

`--descriptor/-d`

* partial native application descriptor
* Add the publisher to a given native application in cauldron for a given platform.

**Default** Prompt to pick the platform(ios|android) and the native app(if there are more than one native app defined in cauldron)
**Example** `ern cauldron add publisher --githubUrl git@github.com:username:/org-name/repo.git -d MyNativeApp:android`

#### Remarks

* The `ern cauldron add publisher` command is mostly used during the initial setup of cauldron.
