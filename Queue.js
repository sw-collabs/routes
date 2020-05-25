const PARENT = i => Math.floor(i/2);
const LEFT = i => i*2;
const RIGHT = i => i*2 + 1;

export default class Queue {
  constructor(comparator) {
    this.pred = comparator;
    this.A = [null]; /* Insert dummy value, index must start at 1 */
  }

  swap(i, j) {
    let tmp = this.A[i];
    this.A[i] = this.A[j];
    this.A[j] = tmp;
  }

  topDown(i) {
    let candidate, left, right;

    left = LEFT(i);
    right = RIGHT(i);

    let SIZE = this.size();
    let A_i = this.A[i];
    if (left <= SIZE && this.pred(this.A[left], A_i)) {
      candidate = left;
      A_i = this.A[candidate];
    } else {
      candidate = i;
    }

    if (right <= SIZE && this.pred(this.A[right], A_i)) {
      candidate = right;
    }

    if (candidate !== i) {
      this.swap(candidate, i);
      this.topDown(candidate);
    }
  }

  bottomUp(i) {
    let parent = PARENT(i);

    while (parent >= 1) {
      if (this.pred(this.A[i], this.A[parent])) {
        this.swap(parent, i);
        i = parent;
        parent = PARENT(parent);
      } else {
        parent = 0;
      }
    }
  }

  insert(V) {
    this.A.push(V);
    this.bottomUp(this.size()); // heapify
  }

  peak() {
    if (this.size() === 0) {
      return null;
    }

    return this.A[1];
  }

  pop() {
    if (this.size() === 0) {
      return null;
    }

    this.swap(1, this.size());
    const top = this.A.pop(); // removes last element

    this.topDown(1); // reheapify

    return top;
  }

  reheap() {
    let i;
    for (i=Math.floor(this.size()/2); i >= 1; i--) {
      this.topDown(i);
    }
  }

  size() {
    return this.A.length - 1;
  }
}