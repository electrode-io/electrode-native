// @flow

import {
  PackagePath
} from 'ern-core'

export interface ApiImplGeneratable {
  generate (apiDependency: PackagePath,
            paths: Object,
            reactNativeVersion: string,
            plugins: Array<PackagePath>,
            apis: Array<Object>,
            regen: boolean): any;

  +name: string
}
