import { checkConfig, readIssues } from './utils.mjs'

;(async () => {
  checkConfig()

  let prs = await readIssues()

  console.log('All issues: ' + prs.length)

  prs = prs.filter(pr => pr.pull_request)

  console.log('PRs: ' + prs.length)

  const dateGroups = {}
  const users = {}
  const bots = {}

  for (const pr of prs) {
    users[pr.user.login] = (users[pr.user.login] ?? 0) + 1

    const date = pr.created_at.slice(0, 7)

    dateGroups[date] = dateGroups[date] ?? { total: 0, open: 0, closed: 0, merged: 0 }

    const group = dateGroups[date]

    group.total++

    if (pr.user.type === 'Bot') {
      bots[pr.user.login] = (bots[pr.user.login] ?? 0) + 1
    } else if (pr.state === 'open') {
      group.open++
    } else if (pr.state === 'closed') {
      if (pr.pull_request.merged_at) {
        group.merged++
      } else {
        group.closed++
      }
    } else {
      console.log('pr state:', pr.state)
    }
  }

  console.log('Bots:', bots)

  const sortedUsers = Object.keys(users)
    .filter(user => users[user] > 1)
    .sort((a, b) => users[b] - users[a])
    .slice(0, 50)

  console.log('-------------')

  console.log('Users:')

  for (const user of sortedUsers) {
    console.log(user, users[user])
  }

  console.log('-------------')

  console.log('Month', 'Open', 'Closed', 'Merged')

  const dates = Object.keys(dateGroups).sort()

  for (const date of dates) {
    const group = dateGroups[date]
    console.log(date, group.open, group.closed, group.merged)
  }
})()
