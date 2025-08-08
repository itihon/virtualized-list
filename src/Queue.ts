type Node<T> = {
  value: T;
  next: Node<T> | undefined;
}

export default class Queue<T> {
  private _head: Node<T> | undefined;
  private _tail: Node<T> | undefined;

  enqueue(data:T) {
    if (!this._head) {
      this._head = { value: data, next: undefined };
      this._tail = this._head;
    }
    else {
      const node = { value: data, next: undefined };
      if (this._tail) {
        this._tail.next = node;
        this._tail = node;
      }
    }
  }

  dequeue():T | undefined {
    if (this._head) {
      const node = this._head;
      this._head = node.next;
      return node.value;
    }
  }

  last():T | undefined {
    return this._tail?.value;
  }

  clear() {
    this._head = undefined;
    this._tail = undefined;
  }
}