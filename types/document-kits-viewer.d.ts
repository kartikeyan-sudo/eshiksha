declare module "@document-kits/viewer" {
  export type ViewerOptions = {
    parent: HTMLElement;
    src: string | Uint8Array | ArrayBuffer;
    resourcePath: string;
    disableCORSCheck?: boolean;
    disableAutoSetTitle?: boolean;
    appOptions?: Record<string, unknown>;
  };

  export type ViewerApp = {
    initializedPromise?: Promise<unknown>;
    eventBus?: {
      on: (eventName: string, callback: (event: Record<string, unknown>) => void) => void;
      off?: (eventName: string, callback: (event: Record<string, unknown>) => void) => void;
    };
    page?: number;
    pagesCount?: number;
    close?: () => void;
    cleanup?: () => void;
    pdfViewer?: {
      currentPageNumber?: number;
      pagesCount?: number;
    };
  };

  export function createViewerApp(options: ViewerOptions): ViewerApp;
}
