// src/types/build-meta.d.ts
declare module "@/build-meta" {
  export const BUILD_ID: string
  export const builtAt: string
  export const commit: string
  export const version: string
  export const buildTime: string

  export const BUILD_META: {
    buildId: string
    builtAt: string
    commit: string
    version: string
    buildTime: string
  }

  const _default: typeof BUILD_META
  export default _default
}
