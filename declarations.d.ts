/** esbuild loads .gif files as base64 data URLs via the `dataurl` loader. */
declare module '*.gif' {
  const src: string;
  export default src;
}
