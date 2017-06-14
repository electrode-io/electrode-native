// @flow

import {
  Dependency
} from '@walmart/ern-util'

export interface ApiImplGeneratable {
  generate (api: string,
            paths: Object,
            plugins: Array<Dependency>): any;

  name(): string
}
