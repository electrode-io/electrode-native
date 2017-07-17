// @flow

import {
  Dependency
} from '@walmart/ern-util'

export interface ApiImplGeneratable {
  generate (paths: Object,
            reactNativeVersion: string,
            plugins: Array<Dependency>): any;

  +name : string
}
