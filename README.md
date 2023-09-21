You don't need to install any dependencies, it's just Node and npm.

Configuration options need to be set in `config.mjs` before running any of the scripts.

- `token` - A GitHub access token. You can generate a token at <https://github.com/settings/tokens?type=beta>.
- `username` - Your GitHub username.
- `repo` - The name of the repository. e.g. `vuejs/core`.

## Scrapers

There are various scripts available, but `issues-scraper.mjs` must be run before the others:

```sh
npm run scrape-issues
```

Depending on what you're trying to do, that might be the only script you need.

___

If you want to know which files are changed by the PRs, you should run `pr-files-scraper.mjs`:

```sh
npm run scrape-pr-files
```

This will only download the files for open PRs, but it's a one-line change if you also want to include closed PRs.

---

To download the comments for issues (and PRs), run:

```sh
npm run scrape-comments
```

GitHub's rate limits prevent downloading the comments for all issues in a large repo, like `vuejs/core`. The script will only download comments for issues with a lot of comments or a lot of reactions on the original post. You can comment out that restriction to download them all, but you'll need to wait an hour once you hit the limit.

In addition, it will only download comments for 250 issues per run. Run the script repeatedly until you have what you need.

If you only want to download comments for *open* issues, there is a section in the code that can be uncommented to do that.

## Analyzers

There are various scripts to analyze the downloaded data.

---

To generate monthly counts for the number of open, closed and merged PRs, run:

```sh
npm run analyze-pr-merges
```

This requires `scrape-issues` to be run first.

The script also dumps out the names of any bots it encounters, plus a summary of the users with the most PRs. These are useful for assessing whether some users should be excluded from the counts. Accounts marked as bots are automatically excluded.

---

To find PRs with small changes run:

```sh
npm run analyze-small-changes
```

This requires `scrape-issues` and `scrape-pr-files` to be run first.

---

To find issues/PRs with the most comments or the most reactions, run:

```sh
npm run analyze-comments
```

This requires `scrape-issues` and `scrape-comments` to be run first.
