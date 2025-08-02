import { AVLTree, type AVLNode } from 'avl';
import type { ItemData, ItemRangeData } from './typings';

const isLeafNode = (node: AVLNode<number, ItemRangeData>): boolean =>
  !node.left && !node.right;

export default class RangeTree extends AVLTree<number, ItemRangeData> {
  /* queues for updating ranges */
  private _leafNodesQueue: Set<AVLNode<number, ItemRangeData>> = new Set();
  private _nodesQueue: Set<AVLNode<number, ItemRangeData>> = new Set();

  private _enqueNodeForUpdate(node: AVLNode<number, ItemRangeData>) {
    if (isLeafNode(node)) {
      this._leafNodesQueue.add(node);
    }
    else {
      this._nodesQueue.add(node);
    }
  }

  private _recalculateRange(node: AVLNode<number, ItemRangeData>) {
    const nodeLeftData = node.left?.data;
    const nodeRightData = node.right?.data;
    const nodeData = node.data;

    if (nodeData) {
      nodeData.range = nodeData.size;

      if (nodeLeftData) {
        nodeData.range += nodeLeftData.range;
      }
      
      if (nodeRightData) {
        nodeData.range += nodeRightData.range;
      }
    }
  }

  private _updateRanges() {
    let node: AVLNode<number, ItemRangeData> | null | undefined = null;

    for (node of this._leafNodesQueue) {
      this._recalculateRange(node);
    }
    
    for (node of this._nodesQueue) {
      this._recalculateRange(node);
    }

    // propagate changes further to the root
    let parentNode = node?.parent;
    while (parentNode) {
      this._recalculateRange(parentNode);
      parentNode = parentNode.parent;
    }

    this._leafNodesQueue.clear();
    this._nodesQueue.clear();
  }

  private _modifyNode(node: AVLNode<number, ItemRangeData> | null): typeof node {
    if (!node) return null;

    const enqueNodeForUpdate = this._enqueNodeForUpdate.bind(this);

    let originalLeft = node.left;
    let originalRight = node.right;
    let originalParent = node.parent;

    Object.defineProperties(node, { 

      left: { 
        get: () => originalLeft,
        set (newNode: AVLNode<number, ItemRangeData>) {
          originalLeft = newNode; 
          enqueNodeForUpdate(this);
        },
      },

      right: { 
        get: () => originalRight,
        set (newNode: AVLNode<number, ItemRangeData>) {
          originalRight = newNode; 
          enqueNodeForUpdate(this);
        },
      },

      parent: { 
        get: () => originalParent,
        set (newNode: AVLNode<number, ItemRangeData>) {
          originalParent = newNode; 
          enqueNodeForUpdate(this);
        },
      },
    });

    return node;
  }

  findByOffset(offset:number) {
    const root = this.root;
    let subtree = root;
    let isRight = false;
    let rightTraverseCount = 0;
    let previousOffset = 0;
    let leftClosestNode;

    while (subtree) {
      let currentOffset = previousOffset;

      if (isRight || subtree === this.root) {
        currentOffset += (subtree.left?.data?.range || 0) + (subtree.data?.size || 0);
      }
      else {
        currentOffset -= (subtree.right?.data?.range || 0) + (subtree.parent?.data?.size || 0);
      }

      if (currentOffset < offset) {
        leftClosestNode = subtree;
      }

      if (!subtree.left && !subtree.right && rightTraverseCount === 0) {
        leftClosestNode = subtree;
      }
      
      if (offset === currentOffset) {
        return subtree;
      }
      else if (offset < currentOffset) {
        subtree = subtree.left;
        isRight = false;
      }
      else if (offset > currentOffset) {
        subtree = subtree.right;
        isRight = true;
        rightTraverseCount++;
      }

      previousOffset = currentOffset;
    }

    return leftClosestNode;
  }

  setNodeSize(key:number, size:number) {
    const node = this.at(key);

    if (node) {
      if (node.data) {
        node.data.size = size;
        this._enqueNodeForUpdate(node);
        this._updateRanges();
      }
    }
  }

  insert(key: number, data?: ItemData): AVLNode<number, ItemRangeData> | null

  override insert(key: number, data?: ItemRangeData): AVLNode<number, ItemRangeData> | null {
    if (data) {
      const node = this._modifyNode(super.insert(key, { ...data, range: data.size }));
      this._updateRanges();
      return node;
    }
    return null;
  }

  remove(key: number): number | null {
    const result = super.remove(key);
    this._updateRanges();
    return result;
  }
}
