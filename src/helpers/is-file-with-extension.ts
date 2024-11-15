import { hasExtension } from "./has-extension";
import { isFile } from "./is-file";

export const isFileWithExtension = (
  filePath?: string,
  extension?: string,
): filePath is string => {
  if (!filePath || !extension) {
    return false;
  }

  return isFile(filePath) && hasExtension(filePath, extension);
};
