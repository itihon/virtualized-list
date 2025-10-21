export default class OneTimeValue<T> {
  private _defaultValue: T;
  private _value: T | null = null;

  constructor(defaultValue: T) {
    this._defaultValue = defaultValue;
  }

  set(value: T) {
    this._value = value;
  }

  read(): T {
    const value = this._value;
    this._value = null

    return value !== null ? value : this._defaultValue;
  }
}