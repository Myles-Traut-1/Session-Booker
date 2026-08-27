export default function globalTeardown() {
    const replset = (globalThis as any).__MONGO_REPLSET__;
    replset?.stop();
}