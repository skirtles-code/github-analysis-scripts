/*
 * This script attempts to find PRs containing small changes.
 *
 * Set configuration in config.mjs before running this script.
 *
 * Both issues-scraper.mjs and pr-files-scraper.mjs need to be run before this script.
 */
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { checkConfig, getDataPath, readIssues } from './utils.mjs'

// The number of lines a 'small change' can change
const THRESHOLD = 3

const prFilesPath = getDataPath('pr-files')

;(async () => {
  checkConfig()

  const prFiles = await fsPromises.readdir(prFilesPath)

  if (!prFiles.length) {
    console.log(`Directory ${prFilesPath} is empty. Aborting.`)
    return
  }

  const issuesMap = Object.create(null)

  for (const issue of await readIssues()) {
    issuesMap[issue.number] = issue
  }

  const justTests = []
  const smallChangeWithTest = []
  const smallChangeWithoutTest = []

  for (const jsonFile of prFiles) {
    const content = await fsPromises.readFile(path.join(prFilesPath, jsonFile))
    const { files, number } = JSON.parse(content)
    let filesChanged = 0
    let changes = 0
    let hasTest = false

    for (const file of files) {
      if (file.filename.includes('__tests__')) {
        hasTest = true
      } else {
        filesChanged++
        changes += Math.max(file.additions, file.deletions)
      }
    }

    if (filesChanged === 0 && hasTest) {
      justTests.push(number)
    } else if (filesChanged === 1 && changes <= THRESHOLD) {
      if (hasTest) {
        smallChangeWithTest.push(number)
      } else {
        smallChangeWithoutTest.push(number)
      }
    }
  }

  console.log(`Tests only (${justTests.length}):`)

  for (const pr of justTests) {
    console.log('* ' + formatIssue(pr))
  }

  console.log('-----------------')

  console.log(`Small changes, with tests (${smallChangeWithTest.length}):`)

  for (const pr of smallChangeWithTest) {
    console.log('* ' + formatIssue(pr))
  }

  console.log('-----------------')

  console.log(`Small changes, no tests (${smallChangeWithoutTest.length}):`)

  for (const pr of smallChangeWithoutTest) {
    console.log('* ' + formatIssue(pr))
  }

  function formatIssue(number) {
    const issue = issuesMap[number]

    // return `[${number}](https://github.com/vuejs/core/${issue.pull_request ? 'pull' : 'issues'}/${number}) - ${issue.title}`
    return `${number} - ${issue.title}`
  }
})()
