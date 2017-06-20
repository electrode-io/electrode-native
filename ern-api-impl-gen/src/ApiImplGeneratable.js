// @flow

import {
  Dependency
} from '@walmart/ern-util'

export interface ApiImplGeneratable {
  generate (api: string,
            paths: Object,
            reactNativeVersion: string,
            plugins: Array<Dependency>): any;

  +name : string
}
