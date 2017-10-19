// @flow

import {
  Dependency
} from 'ern-util'

export interface ApiImplGeneratable {
  generate (apiDependency: Dependency,
            paths: Object,
            reactNativeVersion: string,
            plugins: Array<Dependency>,
            apis:Array<Object>): any;

  +name : string
}
