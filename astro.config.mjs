import { defineConfig } from "astro/config";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const base = repository ? `/${repository}` : "/";

export default defineConfig({
  site: "https://example.github.io",
  base
});
