/**
 * Custom FastDOM implementation
 *
 * This module provides a simple interface to batch DOM read/write operations
 * which helps prevent layout thrashing by properly sequencing DOM operations.
 *
 * It uses a custom implementation that mimics FastDOM's API but doesn't rely on
 * the external library, avoiding potential import issues.
 */

// Queues for batching operations
const readQueue: Array<{ fn: Function; callback: Function }> = [];
const writeQueue: Array<{ fn: Function; callback: Function }> = [];

// Frame tracking
let scheduledAnimationFrame = false;

/**
 * Process all queued operations in the correct order
 */
function processQueues() {
  // Process all read operations first
  const reads = readQueue.splice(0, readQueue.length);
  reads.forEach(({ fn, callback }) => {
    try {
      const result = fn();
      callback(result);
    } catch (error) {
      console.error('Error in read operation:', error);
      callback(null);
    }
  });

  // Then process all write operations
  const writes = writeQueue.splice(0, writeQueue.length);
  writes.forEach(({ fn, callback }) => {
    try {
      const result = fn();
      callback(result);
    } catch (error) {
      console.error('Error in write operation:', error);
      callback(null);
    }
  });

  // Reset the frame flag
  scheduledAnimationFrame = false;

  // If new operations were added during processing, schedule another frame
  if (readQueue.length > 0 || writeQueue.length > 0) {
    scheduleFrame();
  }
}

/**
 * Schedule a frame to process queues if not already scheduled
 */
function scheduleFrame() {
  if (!scheduledAnimationFrame) {
    scheduledAnimationFrame = true;
    requestAnimationFrame(processQueues);
  }
}

/**
 * Queue a read operation
 */
function measure(callback: Function, fn: Function) {
  readQueue.push({ fn, callback });
  scheduleFrame();
}

/**
 * Queue a write operation
 */
function mutate(callback: Function, fn: Function) {
  writeQueue.push({ fn, callback });
  scheduleFrame();
}

/**
 * Clear all queued operations
 */
function clear() {
  readQueue.length = 0;
  writeQueue.length = 0;
}

// Export the FastDOM-like API
export default {
  /**
   * Schedule a DOM read operation
   * Use for operations that read from the DOM (getBoundingClientRect, offsetHeight, etc.)
   *
   * @param fn Function that performs DOM read operations
   * @returns Promise that resolves with the result of fn
   */
  read: <T>(fn: () => T): Promise<T> => {
    return new Promise((resolve) => {
      measure((result) => {
        resolve(result as T);
      }, fn);
    });
  },

  /**
   * Schedule a DOM write operation
   * Use for operations that write to the DOM (classList, style, appendChild, etc.)
   *
   * @param fn Function that performs DOM write operations
   * @returns Promise that resolves when the operation is complete
   */
  write: <T>(fn: () => T): Promise<T> => {
    return new Promise((resolve) => {
      mutate((result) => {
        resolve(result as T);
      }, fn);
    });
  },

  /**
   * Schedule a DOM read operation followed immediately by a write operation
   * Useful for read-then-write patterns (measure then update)
   *
   * @param readFn Function that performs DOM read operations
   * @param writeFn Function that performs DOM write operations using read results
   * @returns Promise that resolves when both operations are complete
   */
  readThenWrite: <R, W>(
    readFn: () => R,
    writeFn: (readResult: R) => W,
  ): Promise<W> => {
    return new Promise((resolve) => {
      measure((readResult) => {
        mutate(
          (writeResult) => {
            resolve(writeResult as W);
          },
          () => writeFn(readResult as R),
        );
      }, readFn);
    });
  },

  /**
   * Clear all scheduled tasks
   * Useful when component is unmounting or when you need to cancel pending operations
   */
  clear,
};
