export default class BooleanToggle {
  private _value = false;

  constructor(initialValue: boolean = false) {
    this._value = initialValue;
  }

  /**
   * - value: false -> true, rising: true => true;
   * - value: true -> false, rising: false => true;
   * - otherwise returns false;
   */
  set(value: boolean, rising: boolean = false): boolean {
    let result;

    if (rising) {
      if (!this._value && value) {
        result = true;
      }
      else {
        result = false;
      }
    }
    else {
      if (this._value && !value) {
        result = true;
      }
      else {
        result = false;
      }
    }

    this._value = value;

    return result;
  }
}
