const process = require('process');
const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
let Parser = require('rss-parser');
const keymap = require('./keymap.json');
const sourceLink = core.getInput('source-link');
const postsPath = './my-posts.json';
const exec = require('./exec');
const GITHUB_TOKEN = core.getInput('gh_token');
const oldPosts = require(postsPath);
const testRunFlag = core.getInput('test-run');

const commitPosts = async () => {
  // Getting config
  const committerUsername = 'posts-backup-workflow';
  const committerEmail = 'posts.backup.workflow@example.com';
  const commitMessage = 'update my-posts.json';
  await exec('git', [
    'config',
    '--global',
    'user.email',
    committerEmail,
  ]);
  if (GITHUB_TOKEN) {
    // git remote set-url origin
    await exec('git', ['remote', 'set-url', 'origin',
      `https://${GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`
      ]);
  }
  await exec('git', ['config', '--global', 'user.name', committerUsername]);
  await exec('git', ['add', postsPath]);
  await exec('git', ['commit', '-m', commitMessage]);
  await exec('git', ['push']);
};

new Parser().parseURL(sourceLink).then(data => {
    if(!data.items) {
        return;
    } else {
        var posts = [];
        for(item of data.items) {
            posts.push({
                title: item[keymap['douban'].title],
                author: item[keymap['douban'].author],
                dateCreated: item[keymap['douban'].dateCreated],
                canonicalLink: item[keymap['douban'].canonicalLink],
                contentFormatted: item[keymap['douban'].contentFormatted],
                contentText: item[keymap['douban'].contentText],
                abstract: item[keymap['douban'].abstract]
            });
        }
        if (JSON.stringify(posts) !== JSON.stringify(oldPosts)) {
            console.log('writing posts');
            fs.writeFileSync(postsPath, JSON.stringify(posts));
            if (testRunFlag == 'false') {
                console.log('commiting changes');
                commitPosts().then().catch();
            }
        }
    }
}).catch();
