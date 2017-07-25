// @flow

import {
  Dependency
} from 'ern-util'

export interface ApiImplGeneratable {
  generate (paths: Object,
            reactNativeVersion: string,
            plugins: Array<Dependency>): any;

  +name : string
}
