declare module "node-gyp-build" {
  function load(packageRoot: string): unknown;
  export = load;
}
