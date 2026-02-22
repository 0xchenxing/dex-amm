interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: <E extends string>(event: E, callback: (data: any) => void) => void;
    removeListener: <E extends string>(event: E, callback: (data: any) => void) => void;
  };
}

