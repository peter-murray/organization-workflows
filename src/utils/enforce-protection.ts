import { Context } from 'probot' // eslint-disable-line @typescript-eslint/no-unused-vars

async function enforceProtection (
  octokit: Context['octokit'],
  repository: { owner: string, repo: string },
  context_name: string,
  enforce_admin = false
): Promise<void> {
  const repo = await octokit.repos.get({
    ...repository,
    mediaType: {
      previews: ['symmetra']
    }
  })
  
  let protection: any;

  try {
    protection = await octokit.repos.getBranchProtection({
      ...repository,
      branch: repo.data.default_branch
    })
  } catch (e) {
    console.error(e)
  }

  let enforce_admins = protection && protection.data.enforce_admins.enabled
  
  if (enforce_admins === true) {
    enforce_admin = true
  } else if (enforce_admin) {
    enforce_admins = enforce_admin
  }
  await octokit.repos.updateBranchProtection({
    ...repository,
    branch: repo.data.default_branch,
    required_status_checks: {
      strict: protection ? protection.data.required_status_checks.strict : false,
      contexts: [...(protection ? protection.data.required_status_checks.contexts : []), context_name]
    },
    enforce_admins: enforce_admins || false,
    required_pull_request_reviews: protection?.data?.required_pull_request_reviews ? {
      dismiss_stale_reviews: protection ? protection.data.required_pull_request_reviews.dismiss_stale_reviews : false,
      require_code_owner_reviews: protection ? protection.data.required_pull_request_reviews.require_code_owner_reviews : 0
    } : null,
    required_linear_history: protection && protection.data.required_linear_history.enabled,
    allow_force_pushes: protection && protection.data.allow_force_pushes.enabled,
    allow_deletions: protection && protection.data.allow_deletions.enabled,
    restrictions: null
  })
}

export default enforceProtection
