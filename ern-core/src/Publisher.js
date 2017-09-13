// @flow
export interface Publisher {
  publish(any): any;
  + name: string;
  + url: string
}
