/*
 * This script downloads all the issues & PRs for a repo.
 *
 * Set configuration in config.mjs before running this script.
 *
 * Output will be in data/[repo-name]/issues.
 *
 * To download comments, see comments-scraper.mjs.
 * To download file details for PRs, see pr-files-scaper.mjs.
 */
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import config from '../config.mjs'
import { checkConfig, fetchData, getDataPath } from './utils.mjs'

let page = 0

const issuesPath = getDataPath('issues')

const loadIssues = async () => {
  while (true) {
    // If we get to 1000 pages there's probably a problem
    if (page > 1000) {
      throw new Error('More than 1000 pages. This may indicate a problem. If not, change the limit.')
    }

    page++

    const hasMore = await fetchPage(page)

    if (!hasMore) {
      break
    }
  }
}

;(async () => {
  checkConfig()

  await fsPromises.mkdir(issuesPath, { recursive: true })

  const pages = await fsPromises.readdir(issuesPath)

  if (pages.length > 0) {
    console.log(`There are already ${pages.length} files in ${issuesPath}.\nTo ensure no data gets overwritten, this run has been aborted.\nYou should move or delete those files and re-run this script.`)
    return
  }

  for (let index = 0; index < 10; ++index) {
    setTimeout(loadIssues, 50 * index)
  }
})()

const fetchPage = async (page) => {
  const pageSize = 100
  const issues = await fetchData(`https://api.github.com/repos/${config.repo}/issues?per_page=${pageSize}&state=all&page=${page}`)

  if (issues.length) {
    fsPromises.writeFile(path.join(issuesPath, `page${page}.json`), JSON.stringify({
      fetched: Date.now(),
      page,
      issues
    }, null, 2))

    console.log(`Loaded ${issues.length} issues for page ` + page)
  }

  return issues.length === pageSize
}
