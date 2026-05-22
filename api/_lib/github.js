const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github.v3+json'
};

async function getFile(path) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
  return res.json();
}

async function putFile(path, content, sha, message) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
    sha
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path}: ${res.status}`);
  return res.json();
}

async function readJSON(path) {
  const file = await getFile(path);
  if (!file) return [];
  return JSON.parse(Buffer.from(file.content, 'base64').toString());
}

async function writeJSON(path, data, sha, message) {
  return putFile(path, JSON.stringify(data, null, 2), sha, message);
}

module.exports = { readJSON, writeJSON, getFile };