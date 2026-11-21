export class LatencyTracker {
  private startTime: number = 0;
  private lastMark: number = 0;

  mark(name: string): void {
    const now = performance.now();
    if (this.startTime === 0) {
      this.startTime = now;
    }
    const latency = now - this.lastMark;
    this.lastMark = now;
    console.log(`[Latency ${name}]: ${latency}ms`);
  }

  getTotalLatency(): number {
    if (this.startTime === 0) return 0;
    return performance.now() - this.startTime;
  }
}