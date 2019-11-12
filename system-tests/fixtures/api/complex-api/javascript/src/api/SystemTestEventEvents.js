// @flow

export default class SystemTestEventEvents {
  constructor(bridge) {
    this._bridge = bridge;
  }

  addTestEventEventListener(eventListener: Function): string {
    return this._bridge.registerEventListener(
      'com.complexapi.ern.api.event.testEvent',
      eventListener,
    );
  }

  removeTestEventEventListener(uuid: string): any {
    return this._bridge.removeEventListener(uuid);
  }

  emitTestEvent(buttonId: string): void {
    return this._bridge.emitEvent('com.complexapi.ern.api.event.testEvent', {
      data: buttonId,
    });
  }
}
