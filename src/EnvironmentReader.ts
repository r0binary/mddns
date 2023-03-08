import fs from "fs";

export function assertEnvironment(variableName: string): void {
  if (!process.env[variableName]) {
    throw new Error(
      `Required environment variable "${variableName}" not found`
    );
  }
}

export function getEnv(name: string): string {
  if (process.env[`${name}_FILE`]) {
    return fs.readFileSync(process.env[`${name}_FILE`] as string, "utf-8");
  }

  assertEnvironment(name);
  return process.env[name] as string;
}
