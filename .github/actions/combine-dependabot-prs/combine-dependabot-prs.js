module.exports = async ({ github, context, core, inputs }) => {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const baseBranch = "main";
  const combineBranch = inputs.combineBranch;
  const prTitle = inputs.prTitle;
  const prBodyHeader = inputs.prBodyHeader;
  const requiredLabel = (inputs.label || "dependencies").trim();

  const allOpenPrs = await github.paginate(github.rest.pulls.list, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  });

  const dependencyPrs = allOpenPrs
    .filter((pr) => pr.labels.some((label) => label.name === requiredLabel))
    .sort((a, b) => a.number - b.number);

  if (dependencyPrs.length === 0) {
    core.info("No open dependency PRs found; nothing to combine.");
    return;
  }

  const { data: baseRef } = await github.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });

  const baseSha = baseRef.object.sha;

  try {
    await github.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${combineBranch}`,
    });

    await github.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${combineBranch}`,
      sha: baseSha,
      force: true,
    });
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }

    await github.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${combineBranch}`,
      sha: baseSha,
    });
  }

  for (const pr of dependencyPrs) {
    try {
      await github.rest.repos.merge({
        owner,
        repo,
        base: combineBranch,
        head: pr.head.sha,
        commit_message: `Merge #${pr.number} into ${combineBranch}`,
      });
      core.info(`Merged PR #${pr.number} (${pr.head.ref}) into ${combineBranch}`);
    } catch (error) {
      core.setFailed(
        `Failed to merge PR #${pr.number} (${pr.head.ref}) into ${combineBranch}: ${error.message}`,
      );
      throw error;
    }
  }

  const includedPrLines = dependencyPrs.map((pr) => `- #${pr.number}`).join("\n");
  const prBody = `${prBodyHeader}\n\nIncluded PRs:\n${includedPrLines}`;

  const existingCombinedPr = allOpenPrs.find(
    (pr) =>
      pr.base.ref === baseBranch &&
      pr.head.ref === combineBranch &&
      pr.user?.login !== "dependabot[bot]",
  );

  if (existingCombinedPr) {
    await github.rest.pulls.update({
      owner,
      repo,
      pull_number: existingCombinedPr.number,
      title: prTitle,
      body: prBody,
    });
    core.info(`Updated existing combined PR #${existingCombinedPr.number}`);
    return;
  }

  const { data: newPr } = await github.rest.pulls.create({
    owner,
    repo,
    title: prTitle,
    head: combineBranch,
    base: baseBranch,
    body: prBody,
  });

  core.info(`Created combined PR #${newPr.number}`);
};
