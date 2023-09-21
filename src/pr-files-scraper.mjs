/*
 * This script downloads the names of the files changed by the PRs.
 *
 * Set configuration in config.mjs before running this script.
 *
 * issues-scraper.mjs must be run first.
 *
 * Output will be in data/[repo-name]/pr-files.
 *
 * Only open PRs are considered. Search the code for 'open' if you want to change that.
 *
 * To download comments, see comments-scraper.mjs.
 */
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import config from '../config.mjs'
import { checkConfig, fetchData, getDataPath, readIssues } from './utils.mjs'

const issuesPath = getDataPath('issues')
const prFilesPath = getDataPath('pr-files')

;(async () => {
  checkConfig()

  await fsPromises.mkdir(issuesPath, { recursive: true })
  await fsPromises.mkdir(prFilesPath, { recursive: true })

  const prFiles = await fsPromises.readdir(prFilesPath)

  let prs = await readIssues()

  console.log('All issues: ' + prs.length)

  prs = prs.filter(pr => pr.pull_request)

  console.log('PRs: ' + prs.length)

  // If you want to include closed PRs, remove the next line
  prs = prs.filter(pr => pr.state === 'open')

  console.log('Open PRs: ' + prs.length)

  const totalLength = prs.length

  prs = prs.filter(pr => !prFiles.includes(pr.number + '.json'))

  console.log('PRs with files already loaded: ' + (totalLength - prs.length))
  console.log('PRs not yet loaded: ' + prs.length)

  prs.sort((a, b) => b.number - a.number)

  for (let index = 0; index < 10; ++index) {
    setTimeout(loadFiles, 50 * index)
  }

  async function loadFiles() {
    while (prs.length > 0) {
      await fetchPrFiles(prs.shift())
    }
  }
})()

const fetchPrFiles = async (pr) => {
  const files = await fetchData(`https://api.github.com/repos/${config.repo}/pulls/${pr.number}/files?per_page=100`)

  fsPromises.writeFile(path.join(prFilesPath, `${pr.number}.json`), JSON.stringify({
    fetched: Date.now(),
    number: pr.number,
    files
  }, null, 2))

  console.log('Loaded files for ' + pr.number)
}
