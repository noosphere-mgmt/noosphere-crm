import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

let didLoad = false;

export function loadEnvForCli(): void {
  if (didLoad) return;
  didLoad = true;

  const projectRoot = path.resolve(__dirname, "..");
  dotenv.config({ path: path.join(projectRoot, ".env"), override: false });

  if (process.env.NODE_ENV === "production") {
    const productionPath = path.join(projectRoot, ".env.production");
    if (existsSync(productionPath)) {
      dotenv.config({ path: productionPath, override: true });
    }
    return;
  }

  const localPath = path.join(projectRoot, ".env.local");
  if (existsSync(localPath)) {
    dotenv.config({ path: localPath, override: true });
  }
}
