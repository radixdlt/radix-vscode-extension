import { existsSync, lstatSync } from "fs";

export const isFile = (filePath?: string): boolean =>
  !!filePath && existsSync(filePath) && lstatSync(filePath).isFile();
