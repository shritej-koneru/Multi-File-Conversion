// Minimal type declarations for untyped subpath imports used by file-converter.ts
declare module "pdf-poppler" {
  export function convert(
    pdfPath: string,
    options: {
      format?: string;
      out_dir: string;
      out_prefix: string;
      page?: number;
      scale?: number;
    }
  ): Promise<any>;
  const _default: { convert: typeof convert };
  export default _default;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }
  function pdfParse(dataBuffer: Uint8Array, options?: any): Promise<PdfParseResult>;
  export default pdfParse;
}
