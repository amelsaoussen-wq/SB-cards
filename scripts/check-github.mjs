import "dotenv/config";

// Read-only diagnostic. This script never pushes, creates a branch, or changes GitHub.
const repository = "amelsaoussen-wq/SB-cards";
const token = (process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "").trim();

async function main() {
  if (!token) {
    console.error("GitHub is not connected: save GITHUB_TOKEN in the project's secure secret settings. Do not paste a token into chat or commit it to Git.");
    process.exitCode = 2;
    return;
  }

  async function read(path) {
    return fetch(`https://api.github.com${path}`, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "SB-Cards-read-only-deployment-check",
      },
    });
  }

  const identity = await read("/user");
  if (!identity.ok) {
    console.error(`GitHub authentication check failed (HTTP ${identity.status}). Check token expiration and access in GitHub settings. No write was attempted.`);
    process.exitCode = 1;
    return;
  }

  const response = await read(`/repos/${repository}`);
  if (!response.ok) {
    console.error(`Repository check failed (HTTP ${response.status}). Check access to ${repository}. No write was attempted.`);
    process.exitCode = 1;
    return;
  }

  const repo = await response.json();
  if (repo.full_name?.toLowerCase() !== repository.toLowerCase()) {
    console.error("Unexpected repository response. Stopped without writing anything.");
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({
    authenticated: true,
    repository: repo.full_name,
    defaultBranch: repo.default_branch,
    repositoryReadable: true,
    // A successful GET does not establish token-specific write permission.
    tokenWriteAccessVerified: false,
    changesPushed: false,
  }, null, 2));
  console.log("Before any push, compare the live branch and integrate the feature without replacing existing pages. A valid token alone does not configure Vercel or the database.");
}

main().catch(() => {
  // Do not print request objects, headers, response bodies or environment variables.
  console.error("GitHub could not be reached securely. No changes were sent; retry the read-only check later.");
  process.exitCode = 1;
});
