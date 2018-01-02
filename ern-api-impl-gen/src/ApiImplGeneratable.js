// @flow

import {
  Dependency
} from 'ern-core'

export interface ApiImplGeneratable {
  generate (apiDependency: Dependency,
            paths: Object,
            reactNativeVersion: string,
            plugins: Array<Dependency>,
            apis: Array<Object>,
            regen: boolean): any;

  +name: string
}
