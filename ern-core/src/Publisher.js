// @flow
export interface Publisher {
  publish(): any;
  + name: string;
  + url: string
}
