export const hasExtension = (
  filePath?: string,
  extension?: string,
): boolean => {
  if (!filePath || !extension) {
    return false;
  }
  const fileExtension = filePath.slice(filePath.lastIndexOf("."));
  return fileExtension === extension;
};
