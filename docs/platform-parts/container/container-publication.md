A locally generated container is useful and necessary for example to launch a MiniApp in the Electrode Native runner, or for development and experimentation use, but to be used by a client mobile application, the container will have to be published somewhere.

Electrode Native offers multiple publishers to that end. Publishers are not shipped with Electrode Native but are instead available as independent npm packages that are installed and loaded on demand by Electrode Native.

All publishers have some configuration in common, for example the `url` where the container should be published, or the `container version` to publish. That being said, publishers also expose specific custom configuration that is their own. You should refer to the documentation present in the repository of the publisher(s) for additional details.\
Here is a list of current container publishers offered by Electrode Native :

- **[maven](https://github.com/electrode-io/ern-container-publisher-maven)**\
This publisher can only publish Android containers. It will take care of building the container and uploading the resulting AAR artifact to a Maven repository of your choice.

- **[maven-cli](https://github.com/electrode-io/ern-container-publisher-maven-cli)**\
This publisher can publish Android or iOS containers. It won't take care of building the Android or iOS container. It mostly exposed the `deploy:deploy-file` command of `mvn` to publish a pre-produced artifact _(zipped iOS fat framework for example)_ to a Maven repository.

- **[jcenter](https://github.com/electrode-io/ern-container-publisher-jcenter)**\
This publisher can only publish Android containers. It will take care of building the container and uploading the resulting AAR artifact to a JCenter repository.

- **[git](https://github.com/electrode-io/ern-container-publisher-git)**\
This publisher can be used to publish an Android or iOS container to a remote git repository.

- **[cocoapods-git](https://github.com/electrode-io/ern-container-publisher-cocoapods-git)**\
This publisher can be used to publish an iOS container as a CocoaPod to a remote Git repository.

- **[cocoapods-spec](https://github.com/electrode-io/ern-container-publisher-cocoapods-spec)**\
This publisher can be used to publish the CocoaPods spec of an iOS container to a remote Git pod spec repository.

- **[fs](https://github.com/electrode-io/ern-container-publisher-fs)**\
This publisher can be used to publish Android or iOS containers to a local directory.

- **[dummy](https://github.com/electrode-io/ern-container-publisher-dummy)**\
This publisher is just a dummy publisher for illustration and debugging purposes. It won't publish the container anywhere, but will just log the configuration supplied to it.

It is possible to use more than one publisher for your container. For example, you can choose to publish your Android containers both to Maven and GitHub.
### Using a publisher

There are two ways to use a `publisher`, either `explicitly` or `implicitly`.\
Based on your needs and your context, you might need one way or the other (or both).

**Explicilt publisher use**

Electrode Native offers the [publish-container] command that can be used to publish a container.\
This commands does not require a cauldron.\
It cam publish any pre-generated _(and eventually transformed)_ container.

It is possible to run the [publish-container] command multiple times for the same container, to publish the container to different target repositories.

The use of the [create-container] / [publish-container] commands combo, will be mostly useful for development and experimentation with Electrode Native. It can also be used for automation purposes (CI) in some contexts.

**Implicit pulbisher use**

A publisher will be implicitly used when executing a container generation pipeline containing a publisher.

### Configuring container publication

When explicilty publishing a container, using the `publish-container` command, the publisher configuration should be supplied on the command line. Extra configuration, specific to the publisher, can however kept in a separate json configuration file stored locally or in a cauldron. Refer to the `publish-container` command documentation for more information.

Container publishers can also be added to a container generation `pipeline`, stored in a cauldron, so that it can be shared across users of the Cauldron and automatically triggered whenever regenerating a container from cauldron, using cauldron subcommands.
### Creating a custom Container publisher

As previously mentionned, Electrode Native container publishers are standalone node packages _(published to npm)_ and retrieved dynamically _(they are not packaged within Electrode Native itself). In that sense it is quite easy to implement _(and eventually distribute)_ your own container publisher if needed.

Check our [dummy publisher]([https://github.com/electrode-io/ern-container-publisher-dummy) as a reference to get started.

A few things to keep in mind when creating a Container publisher :

- The package name must be prefixed with `ern-container-publisher-`. This is a convention for Electrode Native Container publishers, and is enforced by Electrode Native.

- You should add a keyword `ern-container-publisher` in the keywords list of the package.json. This is not required, but could be leveraged later on by Electrode Native to facilitate container publishers discovery.

- All you'll have to implement is a class with two getters `get name` (to return the name of the publisher) and `get platforms` (to return the list of supported platforms of the publisher), as well as the `publish(config)` method. This class should be the default export of the module.

- Once your Container publisher is published to npm, it will immediately be available for Electrode Native users. During development, if you need to try out your publisher before publishing it to npm, you can use `ern publish-container` command by using an absolute local file system path to your Container publisher module. `ern publish-container` will call either `index.js` (or `index.ts` as we support TypeScript) from your module directory root, or `src/index.js` if no index was found in root. Thus make sure to name your entry point as `index.js`/`index.ts`.
