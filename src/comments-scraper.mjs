/*
 * This script downloads the comments for the issues/PRs.
 *
 * Set configuration in config.mjs before running this script.
 *
 * issues-scraper.mjs must be run first.
 *
 * Output will be in data/[repo-name]/comments.
 *
 * If you only want comments for open issues/PRs, search the code for 'open'.
 *
 * To avoid hitting GitHub rate limits, comments are only downloaded for issues/PRs that pass a specific threshold,
 * based on the number of comments and reactions on the issue.
 *
 * Comments are only downloaded for 250 issues/PRs per run. Run the script again for more.
 *
 * To download associated files, see pr-files-scraper.mjs.
 */
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { checkConfig, fetchData, getDataPath, readIssues } from './utils.mjs'

const issuesPath = getDataPath('issues')
const commentsPath = getDataPath('comments')

;(async () => {
  checkConfig()

  await fsPromises.mkdir(issuesPath, { recursive: true })
  await fsPromises.mkdir(commentsPath, { recursive: true })

  let issues = await readIssues()
  const comments = await fsPromises.readdir(commentsPath)

  issues = issues.filter(issue => issue.comments > 0)

  console.log(`Issues with comments: ` + issues.length)

  // If you want to include open issues/PRs, uncomment this section
  // issues = issues.filter(issues => issues.state === 'open')
  //
  // console.log('Open issues: ' + issues.length)

  // Only download issues that seem to be getting attention
  issues = issues.filter(issue => issue.comments + issue.reactions.total_count > 3)

  console.log('Issues with enough comments/reactions: ' + issues.length)

  issues = issues.filter(issue => !comments.includes(issue.number + '.json'))

  console.log('Issues not yet loaded: ' + issues.length)

  issues.sort((a, b) => {
    return b.comments - a.comments
  })

  const totalLength = issues.length

  if (!totalLength) {
    return
  }

  issues = issues.slice(0, 250)

  const downloadedLength = issues.length

  let activeLoads = 0

  for (let index = 0; index < 10; ++index) {
    setTimeout(loadComments, 50 * index)
  }

  async function loadComments() {
    activeLoads++

    while (issues.length > 0) {
      await fetchComments(issues.shift())
    }

    activeLoads--

    if (!activeLoads) {
      const remaining = totalLength - downloadedLength

      console.log(`Comments downloaded for ${downloadedLength} issues.`)
      console.log(`${remaining} issues remaining.` + (remaining ? ' Re-run the script to download more.' : ''))
    }
  }
})()

const fetchComments = async (issue) => {
  const comments = await fetchData(issue.comments_url)

  fsPromises.writeFile(path.join(commentsPath, `${issue.number}.json`), JSON.stringify({
    fetched: Date.now(),
    number: issue.number,
    comments
  }, null, 2))

  console.log('Loaded comments for ' + issue.number)
}
