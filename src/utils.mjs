import fsPromises from 'node:fs/promises'
import https  from 'node:https'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import config from '../config.mjs'

export const getDataPath = (dir) => fileURLToPath(new URL(`../data/${config.repo}/${dir}`, import.meta.url))

export const checkConfig = () => {
  if (!config.token) {
    throw new Error('A GitHub token needs to be provided in config.mjs')
  }

  if (!config.username) {
    throw new Error('A GitHub username needs to be provided in config.mjs')
  }

  if (!config.repo || config.repo.split('/').length !== 2) {
    throw new Error('A valid GitHub repository needs to be provided in config.mjs')
  }
}

export const fetchData = (url) => {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': config.username,
          Authorization: `Bearer ${config.token}`
        }
      },
      res => {
        const data = []

        console.log('Status Code:', res.statusCode)

        res.on('data', chunk => {
          data.push(chunk)
        })

        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.log(Buffer.concat(data).toString())
            reject('Request failed')
            return
          }

          const parsed = JSON.parse(Buffer.concat(data).toString())

          resolve(parsed)
        })
      }).on('error', err => {
        console.log('Error: ', err.message)
        reject(err)
      })
  })
}

export const readIssues = async () => {
  const issuesPath = getDataPath('issues')
  const pages = await fsPromises.readdir(issuesPath)

  if (!pages.length) {
    console.log(`Directory ${issuesPath} is empty. Aborting.`)
    throw 'Aborting'
  }

  const prs = []

  for (const page of pages) {
    const content = await fsPromises.readFile(path.join(issuesPath, page))
    const json = JSON.parse(content)
    prs.push(...json.issues)
  }

  return prs
}
