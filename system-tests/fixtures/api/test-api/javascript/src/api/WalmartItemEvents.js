// @flow

export default class WalmartItemEvents {
  _bridge: Object;

  constructor(bridge: Object) {
    this._bridge = bridge;
  }

  addItemAddedEventListener(eventListener: Function): string {
    return this._bridge.registerEventListener(
      'com.test.ern.api.event.itemAdded',
      eventListener,
    );
  }

  removeItemAddedEventListener(uuid: string): any {
    return this._bridge.removeEventListener(uuid);
  }

  emitItemAdded(itemId: string): void {
    return this._bridge.emitEvent('com.test.ern.api.event.itemAdded', {
      data: itemId,
    });
  }
}
