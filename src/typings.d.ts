export interface ItemData {
  /** Item's size */
  size: number;
  /** First item in the range */
  item: HTMLElement;
}

export interface ItemRangeData extends ItemData {
  /** Sum of the item's size and all of its children's sizes */
  range:number;
  /** The data of the next item (singly linked list) */
  next:ItemRangeData | null | undefined;
}