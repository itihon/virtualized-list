import { AVLTree, type AVLNode } from 'avl';
import type { ItemRangeData } from './typings';

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

  private _updateRanges() {
    let node: AVLNode<number, ItemRangeData> | null = null;

    for (node of this._leafNodesQueue) {
      console.log('updateRange leafNode:', node);
    }
    
    for (node of this._nodesQueue) {
      console.log('updateRange node:', node);
    }

    // propagate changes further to the root
    while (node) {
      node = node.parent;
      console.log('updateRange further node:', node);
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
          console.log('set left', 'this:', this, 'newNode:',  newNode);
          enqueNodeForUpdate(this);
        },
      },

      right: { 
        get: () => originalRight,
        set (newNode: AVLNode<number, ItemRangeData>) {
          originalRight = newNode; 
          console.log('set right', 'this:', this, 'newNode:',  newNode);
          enqueNodeForUpdate(this);
        },
      },

      parent: { 
        get: () => originalParent,
        set (newNode: AVLNode<number, ItemRangeData>) {
          originalParent = newNode; 
          console.log('set parent', 'this:', this, 'newNode:',  newNode);
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

  updateRange(key:number, range:number) {
    let node = this.at(key);

    if (node) {
      if (node.data) {
        node.data.range = range;
      }

      while (node) {
        const parent: AVLNode<number, ItemRangeData> | null = node.parent;

        if (parent) {
          const parentLeftData = parent.left?.data;
          const parentRightData = parent.right?.data;

          if (parent.data) {
            if (parentLeftData) {
              parent.data.range = parentLeftData.range + parent.data.range;
            }
            
            if (parentRightData) {
              parent.data.range = parentRightData.range + parent.data.range;
            }
          }
        }

        node = parent;
      }
    }
  }

  insert(key: number, data: ItemRangeData): AVLNode<number, ItemRangeData> | null {
    const node = this._modifyNode(super.insert(key, data));
    this._updateRanges();
    return node;
  }

  remove(key: number): number | null {
    const result = super.remove(key);
    this._updateRanges();
    return result;
  }
}
