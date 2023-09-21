/*
 * This script attempts to find issues with the most comments and reactions.
 *
 * Set configuration in config.mjs before running this script.
 *
 * Both issues-scraper.mjs and comments-scraper.mjs need to be run before this script.
 */
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { checkConfig, getDataPath, readIssues } from './utils.mjs'

const commentsPath = getDataPath('comments')

;(async () => {
  checkConfig()

  const commentsFiles = await fsPromises.readdir(commentsPath)

  if (!commentsFiles.length) {
    console.log(`Directory ${commentsPath} is empty. Aborting.`)
    return
  }

  const issuesMap = Object.create(null)

  for (const issue of await readIssues()) {
    issuesMap[issue.number] = issue
  }

  const commentCount = Object.create(null)
  const reactionCount = Object.create(null)
  const allComments = []

  for (const commentsFile of commentsFiles) {
    const content = await fsPromises.readFile(path.join(commentsPath, commentsFile))
    const { comments, number } = JSON.parse(content)
    const issue = issuesMap[number]

    commentCount[number] = comments.length
    reactionCount[number] = issue.reactions.total_count

    for (const comment of comments) {
      comment.issueNumber = number
      allComments.push(comment)
      reactionCount[number] += comment.reactions.total_count
    }
  }

  const openSortedByCommentCount = Object.keys(commentCount).filter(issue => issuesMap[issue].state === 'open').sort((a, b) => commentCount[b] - commentCount[a])
  const openSortedByReactionCount = Object.keys(reactionCount).filter(issue => issuesMap[issue].state === 'open').sort((a, b) => reactionCount[b] - reactionCount[a])

  console.log('Open issues with the most comments')

  const openIssues = openSortedByCommentCount.filter(issue => !issuesMap[issue].pull_request).slice(0, 20)

  for (const issue of openIssues) {
    console.log(`* ${commentCount[issue]} comments - ${formatIssue(issue)}`)
  }

  console.log('--------------')

  console.log('Open PRs with the most comments')

  const openPRs = openSortedByCommentCount.filter(issue => !!issuesMap[issue].pull_request).slice(0, 20)

  for (const issue of openPRs) {
    console.log(`* ${commentCount[issue]} comments - ${formatIssue(issue)}`)
  }

  console.log('--------------')

  console.log('Open issues with the most reactions (including comments)')

  const reactionIssues = openSortedByReactionCount.filter(issue => !issuesMap[issue].pull_request).slice(0, 20)

  for (const issue of reactionIssues) {
    console.log(`* ${reactionCount[issue]} reactions - ${formatIssue(issue)}`)
  }

  console.log('--------------')

  console.log('Open PRs with the most reactions (including comments)')

  const reactionPRs = openSortedByReactionCount.filter(issue => !!issuesMap[issue].pull_request).slice(0, 20)

  for (const issue of reactionPRs) {
    console.log(`* ${reactionCount[issue]} reactions - ${formatIssue(issue)}`)
  }

  console.log('--------------')

  console.log('Most reacted comments')

  const popularComments = allComments.sort((a, b) => b.reactions.total_count - a.reactions.total_count).slice(0, 30)

  for (const comment of popularComments) {
    console.log(`* ${comment.reactions.total_count} - ${comment.user.login} - ${formatIssue(comment.issueNumber)}`)
  }

  function formatIssue(number) {
    const issue = issuesMap[number]

    // return `[${number}](https://github.com/vuejs/core/${issue.pull_request ? 'pull' : 'issues'}/${number}) - ${issue.title}`
    return `${number} - ${issue.title}`
  }
})()
