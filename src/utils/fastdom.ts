/**
 * Optimized Custom FastDOM implementation
 *
 * This module provides a simple interface to batch DOM read/write operations
 * which helps prevent layout thrashing by properly sequencing DOM operations.
 *
 * Optimizations include:
 * - Efficient queue processing with minimal memory overhead
 * - Consistent frame scheduling
 * - Proper error handling with Promise rejection
 * - Memory management with queue size limits
 * - Support for cancellation of pending operations
 * - Browser compatibility fallbacks
 */

// Browser compatibility fallbacks
const now = (() => {
  if (typeof performance !== 'undefined' && performance.now) {
    return () => performance.now();
  }
  return () => Date.now();
})();

const raf = (() => {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame;
  }
  return (callback: FrameRequestCallback) => setTimeout(callback, 16);
})();

// Types
interface QueueItem<T> {
  fn: () => T;
  resolve: (result: T) => void;
  reject: (error: Error) => void;
  id: number;
  cancelled?: boolean;
}

interface CancellablePromise<T> extends Promise<T> {
  cancel(): boolean;
}

// Efficient queue implementation
class FastQueue<T> {
  private items: T[] = [];
  private head = 0;

  push(item: T): void {
    this.items.push(item);
  }

  shift(): T | undefined {
    if (this.head >= this.items.length) return undefined;
    const item = this.items[this.head];
    delete this.items[this.head]; // Help GC
    this.head++;

    // Reset when queue is empty to prevent memory growth
    if (this.head >= this.items.length) {
      this.items.length = 0;
      this.head = 0;
    }

    return item;
  }

  get length(): number {
    return this.items.length - this.head;
  }

  findIndex(predicate: (item: T) => boolean): number {
    for (let i = this.head; i < this.items.length; i++) {
      if (this.items[i] && predicate(this.items[i])) {
        return i - this.head;
      }
    }
    return -1;
  }

  removeAt(index: number): boolean {
    const actualIndex = this.head + index;
    if (actualIndex >= this.head && actualIndex < this.items.length && this.items[actualIndex]) {
      delete this.items[actualIndex];
      return true;
    }
    return false;
  }

  clear(): void {
    this.items.length = 0;
    this.head = 0;
  }
}

// Queues for batching operations
const readQueue = new FastQueue<QueueItem<unknown>>();
const writeQueue = new FastQueue<QueueItem<unknown>>();

// Frame tracking
let scheduledAnimationFrame = false;
let currentQueueId = 0;
let isProcessing = false;

// Performance monitoring and limits
let lastProcessTime = 0;
let lastCleanup = 0;
const MAX_PROCESS_TIME = 8; // Max time (ms) to spend processing per frame
const MAX_QUEUE_SIZE = 1000; // Prevent unbounded memory growth
const CLEANUP_INTERVAL = 5000; // Cleanup cancelled operations every 5 seconds

/**
 * Add item to queue with size limit enforcement
 */
function addToQueue<T>(queue: FastQueue<QueueItem<T>>, item: QueueItem<T>): void {
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn('FastDOM queue size limit reached, dropping oldest operations');
    queue.shift(); // Remove oldest
  }
  queue.push(item);
}

/**
 * Clean up cancelled operations periodically
 */
function cleanup(): void {
  const currentTime = now();
  if (currentTime - lastCleanup > CLEANUP_INTERVAL) {
    // Note: FastQueue automatically handles cleanup through its shift mechanism
    // Cancelled items are marked and skipped during processing
    lastCleanup = currentTime;
  }
}

/**
 * Process all queued operations in the correct order
 */
function processQueues(): void {
  isProcessing = true;
  const startTime = now();

  // Process all read operations first
  while (readQueue.length > 0) {
    const item = readQueue.shift();
    if (!item || item.cancelled) continue;

    const { fn, resolve, reject } = item;
    try {
      const result = fn();
      resolve(result);
    } catch (error) {
      console.error('Error in read operation:', error);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Process write operations in the same frame for better performance
  const writeStartTime = now();

  while (writeQueue.length > 0) {
    // Check if we've exceeded our time budget
    if (now() - writeStartTime > MAX_PROCESS_TIME) {
      // If we've run out of time, schedule another frame
      scheduledAnimationFrame = false;
      isProcessing = false;
      scheduleFrame();
      return;
    }

    const item = writeQueue.shift();
    if (!item || item.cancelled) continue;

    const { fn, resolve, reject } = item;
    try {
      const result = fn();
      resolve(result);
    } catch (error) {
      console.error('Error in write operation:', error);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  scheduledAnimationFrame = false;
  isProcessing = false;

  // Schedule another frame if there are still operations pending
  if (readQueue.length > 0 || writeQueue.length > 0) {
    scheduleFrame();
  }

  // Track processing time for monitoring
  lastProcessTime = now() - startTime;

  // Periodic cleanup
  cleanup();
}

/**
 * Schedule a frame to process queues if not already scheduled
 */
function scheduleFrame(): void {
  if (!scheduledAnimationFrame && (readQueue.length > 0 || writeQueue.length > 0)) {
    scheduledAnimationFrame = true;
    raf(processQueues);
  }
}

/**
 * Create a cancellable promise for queue operations
 */
function createCancellablePromise<T>(
  queue: FastQueue<QueueItem<T>>,
  fn: () => T,
): CancellablePromise<T> {
  const id = currentQueueId++;
  let cancelled = false;

  const promise = new Promise<T>((resolve, reject) => {
    if (cancelled) {
      reject(new Error('Operation cancelled'));
      return;
    }

    const item: QueueItem<T> = {
      fn,
      resolve: (result: T) => {
        if (!cancelled) resolve(result);
      },
      reject: (error: Error) => {
        if (!cancelled) reject(error);
      },
      id,
      cancelled: false,
    };

    addToQueue(queue, item);
    scheduleFrame();
  }) as CancellablePromise<T>;

  promise.cancel = (): boolean => {
    cancelled = true;
    return cancel(id);
  };

  return promise;
}

/**
 * Clear all queued operations
 */
function clear(): void {
  readQueue.clear();
  writeQueue.clear();
}

/**
 * Cancel a specific operation by ID
 */
function cancel(id: number): boolean {
  // Find and mark the operation as cancelled in the read queue
  const readIndex = readQueue.findIndex((op) => op.id === id);
  if (readIndex !== -1) {
    return readQueue.removeAt(readIndex);
  }

  // Find and mark the operation as cancelled in the write queue
  const writeIndex = writeQueue.findIndex((op) => op.id === id);
  if (writeIndex !== -1) {
    return writeQueue.removeAt(writeIndex);
  }

  return false;
}

// Export the FastDOM-like API
export default {
  /**
   * Schedule a DOM read operation
   * Use for operations that read from the DOM (getBoundingClientRect, offsetHeight, etc.)
   *
   * @param fn Function that performs DOM read operations
   * @returns Cancellable Promise that resolves with the result of fn
   */
  read: <T>(fn: () => T): CancellablePromise<T> => {
    return createCancellablePromise(readQueue as FastQueue<QueueItem<T>>, fn);
  },

  /**
   * Schedule a DOM write operation
   * Use for operations that write to the DOM (classList, style, appendChild, etc.)
   *
   * @param fn Function that performs DOM write operations
   * @returns Cancellable Promise that resolves when the operation is complete
   */
  write: <T>(fn: () => T): CancellablePromise<T> => {
    return createCancellablePromise(writeQueue as FastQueue<QueueItem<T>>, fn);
  },

  /**
   * Schedule a DOM read operation followed immediately by a write operation
   * Useful for read-then-write patterns (measure then update)
   *
   * @param readFn Function that performs DOM read operations
   * @param writeFn Function that performs DOM write operations using read results
   * @returns Promise that resolves when both operations are complete
   */
  readThenWrite: <R, W>(readFn: () => R, writeFn: (readResult: R) => W): Promise<W> => {
    return new Promise((resolve, reject) => {
      const readPromise = createCancellablePromise(readQueue as FastQueue<QueueItem<R>>, readFn);

      readPromise
        .then((readResult: R) => {
          const writePromise = createCancellablePromise(writeQueue as FastQueue<QueueItem<W>>, () =>
            writeFn(readResult),
          );
          return writePromise;
        })
        .then(resolve)
        .catch(reject);
    });
  },

  /**
   * Clear all scheduled tasks
   * Useful when a component is unmounting or when you need to cancel pending operations
   */
  clear,

  /**
   * Get performance metrics
   * @returns Object with performance metrics
   */
  getMetrics: () => ({
    readQueueLength: readQueue.length,
    writeQueueLength: writeQueue.length,
    lastProcessTime,
    isProcessing,
    scheduledAnimationFrame,
  }),
};
