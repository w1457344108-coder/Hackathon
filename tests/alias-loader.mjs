import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveWithExtensions(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    resolvePath(basePath, "index.ts"),
    resolvePath(basePath, "index.tsx")
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const matchedPath = await resolveWithExtensions(
      resolvePath(rootDir, specifier.slice(2))
    );

    if (matchedPath) {
      return {
        url: pathToFileURL(matchedPath).href,
        shortCircuit: true
      };
    }
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !specifier.match(/\.[a-z]+$/i) &&
    context.parentURL
  ) {
    const parentPath = dirname(fileURLToPath(context.parentURL));
    const matchedPath = await resolveWithExtensions(resolvePath(parentPath, specifier));

    if (matchedPath) {
      return {
        url: pathToFileURL(matchedPath).href,
        shortCircuit: true
      };
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}
