export const hooks = {
  readPackage(pkg) {
    if (pkg.version === '11.19.0'
        && ['@trpc/client', '@trpc/server', '@trpc/react-query'].includes(pkg.name)
        && pkg.peerDependencies?.typescript) {
      // The 95 published JS files were inspected: this is a type-checking peer,
      // with no runtime compiler imports. Keep TypeScript 7 as a direct dev tool.
      delete pkg.peerDependencies.typescript;
      if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.typescript;
    }
    return pkg;
  },
};
