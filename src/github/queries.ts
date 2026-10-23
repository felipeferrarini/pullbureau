const ACTOR = '__typename login'
const REVIEW = `author { ${ACTOR} } state submittedAt body`
const COMMENT = `author { ${ACTOR} } createdAt body`
const PAGE = 'pageInfo { hasNextPage endCursor }'

export const OPEN_PRS_QUERY = `
query($q: String!, $after: String) {
  search(query: $q, type: ISSUE, first: 100, after: $after) {
    ${PAGE}
    nodes { ... on PullRequest {
      number title url createdAt isDraft
      labels(first: 100) { nodes { name } }
      repository { name } author { ${ACTOR} }
      reviews(last: 20) { nodes { ${REVIEW} } }
      comments(last: 20) { nodes { ${COMMENT} } }
      reviewThreads(last: 20) { nodes { id comments(last: 10) { nodes { ${COMMENT} } } } }
      commits(last: 1) { nodes { commit { oid statusCheckRollup { state } } } }
    } }
  }
}`

export const HISTORY_PRS_QUERY = `
query($q: String!, $after: String) {
  search(query: $q, type: ISSUE, first: 100, after: $after) {
    ${PAGE}
    nodes { ... on PullRequest {
      number title url createdAt state mergedAt closedAt
      repository { name } author { ${ACTOR} }
      reviews(last: 30) { nodes { ${REVIEW} } }
    } }
  }
}`

export const PR_THREAD_QUERY = `
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      number title url createdAt state
      repository { name } author { ${ACTOR} }
      reviews(first: 100) { nodes { ${REVIEW} } }
      comments(first: 100) { nodes { ${COMMENT} } }
      reviewThreads(first: 50) { nodes { id comments(first: 50) { nodes { ${COMMENT} } } } }
    }
  }
}`
