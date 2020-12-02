/* @flow */
import fs from "react-native-fs";
import { Platform } from "react-native";

export const DocumentDir = fs.DocumentDirectoryPath;
export const CacheDir = fs.CachesDirectoryPath;
const OSPathSeparator = Platform.select({
  ios: "/",
  android: "/",
  windows: "\\",
});

const resolvePath = (...paths: Array<string>) =>
  OSPathSeparator +
  paths
    .join(OSPathSeparator)
    .split(OSPathSeparator)
    .filter((part) => part && part !== ".")
    .join(OSPathSeparator);

// Wrap function to support both Promise and callback
async function withCallback<R>(
  callback?: ?(error: ?Error, result: R | void) => void,
  func: () => Promise<R>
): Promise<R | void> {
  try {
    const result = await func();
    if (callback) {
      callback(null, result);
    }
    return result;
  } catch (err) {
    if (callback) {
      callback(err);
    } else {
      throw err;
    }
  }
}

const FSStorage = (
  location?: string = DocumentDir,
  folder?: string = "reduxPersist",
  excludeFromBackup?: boolean = true
) => {
  const baseFolder = resolvePath(location, folder);
  console.log(`baseFolder is: ${baseFolder}`);

  const pathForKey = (key: string) =>
    resolvePath(baseFolder, key.replace(/[;\\/:*?\"<>|&']/gi, "_"));

  const setItem = (
    key: string,
    value: string,
    callback?: ?(error: ?Error) => void
  ): Promise<void> =>
    withCallback(callback, async () => {
      const path = pathForKey(key);
      console.log(`setItem path is: ${path}`);
      await fs.mkdir(baseFolder, {
        NSURLIsExcludedFromBackupKey: excludeFromBackup,
      });
      await fs.writeFile(pathForKey(key), value, "utf8");
    });

  const getItem = (
    key: string,
    callback?: ?(error: ?Error, result: ?string) => void
  ): Promise<?string> =>
    withCallback(callback, async () => {
      const path = pathForKey(key);
      console.log(`getItem path is: ${path}`);
      if (await fs.exists(pathForKey(key))) {
        const data = await fs.readFile(pathForKey(key), "utf8");
        return data;
      }
    });

  const removeItem = (
    key: string,
    callback?: ?(error: ?Error) => void
  ): Promise<void> =>
    withCallback(callback, async () => {
      const path = pathForKey(key);
      console.log(`removeItem path is: ${path}`);
      if (await fs.exists(pathForKey(key))) {
        await fs.unlink(pathForKey(key));
      }
    });

  const getAllKeys = (
    callback?: ?(error: ?Error, keys: ?Array<string>) => void
  ) =>
    withCallback(callback, async () => {
      const path = pathForKey(key);
      console.log(`getAllKeys path is: ${path}`);
      await fs.mkdir(baseFolder, {
        NSURLIsExcludedFromBackupKey: excludeFromBackup,
      });
      const files = await fs.readDir(baseFolder);
      const fileNames = files
        .filter((file) => file.isFile())
        .map((file) => decodeURIComponent(file.name));
      return fileNames;
    });

  return {
    setItem,
    getItem,
    removeItem,
    getAllKeys,
  };
};

export default FSStorage;
