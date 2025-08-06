declare module 'fastdom' {
  interface FastDom {
    measure(fn: () => void): number;
    mutate(fn: () => void): number;
    clear(id: number): void;
  }

  const fastdom: FastDom;
  export default fastdom;
}
