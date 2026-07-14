import { Maid } from '@hudzax/web-modules/Maid';

type EventCallback = (progress: number, start: number, end: number) => void;

type EventMap = {
  progress: EventCallback;
  finish: EventCallback;
  pause: EventCallback;
  resume: EventCallback;
  destroy: EventCallback;
  restart: EventCallback;
  reverse: EventCallback;
};

export default class Animator {
  private from: number;
  private to: number;
  private duration: number;
  private currentProgress: number;
  private startTime: number | null = null;
  private pausedTime: number | null = null;
  private animationFrameId: number | null = null;
  private events: Partial<Record<keyof EventMap, EventCallback>> = {};
  private isDestroyed = false;
  private maid: Maid;
  public reversed = false;

  constructor(from: number, to: number, duration: number) {
    this.from = from;
    this.to = to;
    this.duration = duration * 1000; // Convert to milliseconds
    this.currentProgress = from;
    this.maid = new Maid();
  }

  private emit(event: keyof EventMap, progress?: number): void {
    if (this.events[event] && !this.isDestroyed) {
      const callback = this.events[event];
      callback?.(progress ?? this.currentProgress, this.from, this.to);
    }
  }

  public on(event: keyof EventMap, callback: EventCallback): void {
    this.events[event] = callback;
  }

  public Start(): void {
    if (this.isDestroyed) return;
    this.startTime = performance.now();
    this.animate();
  }

  private animate(): void {
    if (this.isDestroyed || this.startTime === null) return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    const t = Math.min(elapsed / this.duration, 1);

    const startValue = this.reversed ? this.to : this.from;
    const endValue = this.reversed ? this.from : this.to;
    this.currentProgress = startValue + (endValue - startValue) * t;
    this.emit('progress', this.currentProgress);

    if (t < 1) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
      this.maid.Give(() => cancelAnimationFrame(this.animationFrameId!));
    } else {
      this.emit('finish');
      this.reset();
    }
  }

  public Pause(): void {
    if (this.isDestroyed || this.animationFrameId === null) return;

    cancelAnimationFrame(this.animationFrameId);
    this.pausedTime = performance.now();
    this.emit('pause', this.currentProgress);
  }

  public Resume(): void {
    if (this.isDestroyed || this.pausedTime === null) return;

    const pausedDuration = performance.now() - this.pausedTime;
    if (this.startTime !== null) this.startTime += pausedDuration;
    this.pausedTime = null;
    this.emit('resume', this.currentProgress);
    this.animate();
  }

  public Restart(): void {
    if (this.isDestroyed) return;

    this.reset();
    this.emit('restart', this.currentProgress);
    this.Start();
  }

  public Reverse(): void {
    if (this.isDestroyed) return;

    this.reversed = !this.reversed;
    this.emit('reverse', this.currentProgress);
  }

  public Destroy(): void {
    if (this.isDestroyed) return;

    this.emit('destroy');
    this.maid.Destroy();
    this.reset();
    this.isDestroyed = true;
  }

  private reset(): void {
    this.startTime = null;
    this.pausedTime = null;
    this.animationFrameId = null;
  }
}
