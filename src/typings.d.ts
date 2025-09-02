export interface ItemData {
  /** Item's size */
  size: number;
  /** First item in the range */
  item: string;
}

export interface ItemsToRestore {
  itemsHTML: string; 
  firstVisibleItemsSize: number;
  firstVisibleItemOffset: number;
  secondVisibleItemOffset: number;
  offset: number;
  changed: boolean;
}

export interface ItemRangeData extends ItemData {
  /** Sum of the item's size and all of its children's sizes */
  range:number;
  /** The data of the previous item (linked list) */
  previous:ItemRangeData | null | undefined;
  /** The data of the next item (linked list) */
  next:ItemRangeData | null | undefined;
  /** Current calculated offset */
  currentOffset:number;
}