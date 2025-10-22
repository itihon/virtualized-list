import { AVLTree, type AVLNode } from 'avl';

export interface OffsetTreeNodeData<DataType> {
  /** Row of items */
  items: Array<DataType>;
  /** Row vertical offset */
  offset: number;
  /** Row height */
  height: number;
  /** The data of the previous item (linked list) */
  previous?: OffsetTreeNodeData<DataType> | undefined;
  /** The data of the next item (linked list) */
  next?: OffsetTreeNodeData<DataType> | undefined;
}

export type OffsetTreeNode<DataType> = Required<AVLNode<number, OffsetTreeNodeData<DataType>>>;

export default class OffsetTree extends AVLTree<number, OffsetTreeNodeData<unknown>> {
  private _linkNode(node: OffsetTreeNode<unknown> | null) {
    if (node) {
      const prevNodeData = this.prev(node)?.data;
      const nextNodeData = this.next(node)?.data;
      const nodeData = node.data;

      if (nodeData) {
        if (prevNodeData) {
          prevNodeData.next = nodeData;
          nodeData.previous = prevNodeData;
        }
        
        if (nextNodeData) {
          nodeData.next = nextNodeData;
          nextNodeData.previous = nodeData;
        }
      }
    }
  }
  
  // private _unlinkNode(node: AVLNode<number, ItemRangeData> | null) {
  //   if (node) {
  //     const prevNodeData = this.prev(node)?.data;

  //     if (prevNodeData) {
  //       prevNodeData.next = node.data?.next;
  //     }
  //   }
  // }

  findByOffset<DataType>(offset:number): OffsetTreeNode<DataType> | null {
    const root = this.root;
    let subtree = root;
    let rightTraverseCount = 0;
    let leftClosestNode;

    while (subtree) {
      const currentOffset = subtree.data!.offset;

      if (currentOffset < offset) {
        leftClosestNode = subtree;
      }

      if (!subtree.left && !subtree.right && rightTraverseCount === 0) {
        leftClosestNode = subtree;
      }
      
      if (offset === currentOffset) {
        return subtree as OffsetTreeNode<DataType> | null;
      }
      else if (offset < currentOffset) {
        subtree = subtree.left;
      }
      else if (offset > currentOffset) {
        subtree = subtree.right;
        rightTraverseCount++;
      }
    }

    return leftClosestNode as OffsetTreeNode<DataType> | null;
  }

  insert<DataType>(key: number, data: OffsetTreeNodeData<DataType>): OffsetTreeNode<DataType> | null {
    const node = super.insert(key, data) as OffsetTreeNode<DataType> | null;
    this._linkNode(node);
    return node;
  }

  // remove(key: number): number | null {
  //   const result = super.remove(key);
  //   this._updateRanges();
  //   this._unlinkNode();
  //   return result;
  // }
}