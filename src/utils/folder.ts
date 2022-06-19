import fs from "fs";
import path from "path";
import os from "os";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lua'));

export async function saveContent(content: string): Promise<string> {
  const filePath = path.resolve(tmpDir, Math.random().toString() + '.lua');
  await fs.writeFileSync(filePath, content);
  return filePath;
}
