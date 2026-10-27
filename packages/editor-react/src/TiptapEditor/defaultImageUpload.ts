/**
 * 缺省图片上传：转 base64 data URL（零配置可用）。
 * 生产环境请通过 uploadImage prop 或 EditorProvider.uploadImage 注入服务端上传。
 */
export async function defaultImageUpload(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('read file failed'));
    reader.readAsDataURL(file);
  });
}

/** 从剪贴板/拖拽数据中提取图片文件 */
export function extractImageFiles(files: FileList | File[] | undefined | null): File[] {
  if (!files) return [];
  return Array.from(files).filter((f) => f.type.startsWith('image/'));
}
