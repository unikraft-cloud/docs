/* Build-time public environment exposed by Vite through the ZUDOKU_PUBLIC_
   prefix. Values are inlined into the bundle. */
interface ImportMetaEnv {
  readonly ZUDOKU_PUBLIC_CONTROLPLANE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
