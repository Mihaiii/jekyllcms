'use strict';


class GitHubFile {
  constructor(repo, item) {
    this.repo = repo;
    this.path = item.path;
    this.sha = item.sha;
  }

  content() {
    return Q($.get(`${this.repo.api}/git/blobs/${this.sha}`))
      .then((resp) =>
        atob(resp.content));
  }
}


class GitHubRepo {
  constructor(repoName) {
    this.repoName = repoName;
    this.api = `https://api.github.com/repos/${this.repoName}`;
  }

  files() {
    var url = `${this.api}/git/trees/gh-pages?recursive=1`;
    return Q($.get(url))
      .then((resp) =>
        resp.tree
          .filter((i) => i.type == 'blob')
          .map((i) => new GitHubFile(this, i)));
  }
}


class GitHub {
  repo(repo) {
    return new GitHubRepo(repo);
  }
}