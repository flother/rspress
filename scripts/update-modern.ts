import path from 'path';
import fs from 'fs-extra';
import { getPackages } from '@manypkg/get-packages';
import { getPackageVersion } from '@modern-js/generator-utils';

async function run() {
  const modernVersion = process.env.MODERN_VERSION || 'latest';
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');
  const pkgObj = fs.readJSONSync(pkgPath, 'utf-8');

  pkgObj.devDependencies = await updateModernVersion(
    pkgObj.devDependencies,
    modernVersion,
  );

  fs.writeJSONSync(pkgPath, pkgObj, { spaces: 2 });

  const packages = await getPackages(cwd);
  for (const pkg of packages.packages) {
    const { packageJson, dir } = pkg;
    const { dependencies, devDependencies, peerDependencies } = packageJson;
    packageJson.dependencies = await updateModernVersion(
      dependencies,
      modernVersion,
    );
    packageJson.devDependencies = await updateModernVersion(
      devDependencies,
      modernVersion,
    );
    packageJson.peerDependencies = await updateModernVersion(
      peerDependencies,
      modernVersion,
    );
    fs.writeJSONSync(path.join(dir, 'package.json'), packageJson, {
      spaces: 2,
    });
  }
}

const versionMap = new Map();

const updateModernVersion = async (
  dependencies?: Record<string, string>,
  modernVersion?: string,
) => {
  if (!dependencies) {
    return dependencies;
  }
  for (const dep of Object.keys(dependencies)) {
    if (dep.startsWith('@modern-js')) {
      if (versionMap.get(dep)) {
        dependencies[dep] = versionMap.get(dep);
      } else {
        const version = await getPackageVersion(`${dep}@${modernVersion}`);
        dependencies[dep] = version;
        versionMap.set(dep, version);
      }
    }
  }
  return dependencies;
};

run().catch(e => {
  console.error(e);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
