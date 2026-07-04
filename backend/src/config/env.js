import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const currentDir = dirname(fileURLToPath(import.meta.url));
const backendEnvPath = resolve(currentDir, "../../.env");

dotenv.config({ path: backendEnvPath, override: true });
dotenv.config();
