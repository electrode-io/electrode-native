// @flow

export default class TestEventObjectParamEvents {
  constructor(bridge) {
    this._bridge = bridge;
  }

  addTestEventObjectParamEventListener(eventListener: Function): string {
    return this._bridge.registerEventListener(
      'com.complex.ern.api.event.testEventObjectParam',
      eventListener,
    );
  }

  removeTestEventObjectParamEventListener(uuid: string): any {
    return this._bridge.removeEventListener(uuid);
  }

  emitTestEventObjectParam(opts: any): void {
    opts = opts || {};
    const data = {};
    data.param1 = opts.param1;
    data.param2 = opts.param2;
    return this._bridge.emitEvent('com.complex.ern.api.event.testEventObjectParam', {
      data,
    });
  }
}
