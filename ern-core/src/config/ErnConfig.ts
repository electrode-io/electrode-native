export interface ErnConfig {
  /**
   * Get the value for a given key or the whole configuration if no key is specified
   * @param key Config key
   * @param defaultValue Default value to return if key does not exist
   */
  get(key?: string, defaultValue?: any): any;

  /**
   * Set a value for a given key
   * If the key does not exist, it will be created, otherwise the previous value for
   * the key will be overwritten
   * @param key Config key
   * @param value Value to set for this key
   */
  set(key: string, value: any): void;

  /**
   * Delete a given key and associated value
   * @param key Config key
   * @returns true if the key to delete was found, false otherwise
   */
  del(key: string): boolean;
}
