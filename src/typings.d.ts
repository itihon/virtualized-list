export interface ItemRangeData {
  /** Sum of the item's size and all of its children's sizes */
  range:number;
  /** Item's size */
  size: number;
  /** First item in the range */
  item: HTMLElement;
}