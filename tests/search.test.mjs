import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { test } from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const home = read('index.html')
const guide = read('public/guide.html')
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(([tag]) => tag)
const canonical = (html) => attribute(tags(html, 'link').find((tag) => attribute(tag, 'rel') === 'canonical'), 'href')
const metadata = (html, name) => attribute(tags(html, 'meta').find((tag) => attribute(tag, 'name') === name), 'content')
const schema = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
const homeUrl = canonical(home)
const guideUrl = canonical(guide)

test('search entry pages have distinct descriptions, titles and absolute canonical URLs', () => {
  const titles = new Set()
  const descriptions = new Set()
  for (const html of [home, guide]) {
    assert.match(html, /<html lang="zh-CN">/)
    const title = html.match(/<title>([^<]+)<\/title>/)[1]
    assert.match(title, /王陆雅思语料库/)
    titles.add(title)
    descriptions.add(metadata(html, 'description'))
    assert.match(metadata(html, 'description'), /5,873/)
    assert.match(metadata(html, 'robots'), /\bindex\b/)
    assert.doesNotMatch(metadata(html, 'robots'), /noindex|nofollow/)
    assert.equal(new URL(canonical(html)).protocol, 'https:')
    const socialUrl = tags(html, 'meta').find((tag) => attribute(tag, 'property') === 'og:url')
    assert.equal(attribute(socialUrl, 'content'), canonical(html))
  }
  assert.equal(titles.size, 2)
  assert.equal(descriptions.size, 2)
  assert.equal(new URL('guide.html', homeUrl).href, guideUrl)
})

test('structured data identifies the real application and connects its help page', () => {
  const graph = schema(home)['@graph']
  const site = graph.find((node) => node['@type'] === 'WebSite')
  const app = graph.find((node) => node['@type'] === 'WebApplication')
  const help = schema(guide)
  assert.equal(site.url, homeUrl)
  assert.equal(app.url, homeUrl)
  assert.equal(app.softwareHelp, guideUrl)
  assert.equal(app.applicationCategory, 'EducationalApplication')
  assert.equal(app.inLanguage, 'zh-CN')
  assert.ok(app.featureList.length > 0)
  assert.equal(help.url, guideUrl)
  assert.equal(help.isPartOf['@id'], site['@id'])
  assert.equal(help.about['@id'], app['@id'])
})

test('sitemap lists only existing canonical public pages, without private app states', () => {
  const sitemap = read('public/sitemap.xml')
  assert.match(sitemap, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/)
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => value)
  assert.deepEqual(urls.sort(), [homeUrl, guideUrl].sort())
  assert.equal(new Set(urls).size, urls.length)
  for (const value of urls) {
    const url = new URL(value)
    assert.equal(url.protocol, 'https:')
    assert.equal(url.search, '')
    assert.equal(url.hash, '')
    const file = value === homeUrl ? 'index.html' : `public/${url.pathname.split('/').pop()}`
    assert.ok(existsSync(new URL(`../${file}`, import.meta.url)))
  }
})

test('static introduction describes the actual vocabulary and works without JavaScript', () => {
  const vocabulary = JSON.parse(read('src/vocabulary.json'))
  const chapters = [...new Set(Object.keys(vocabulary).map((section) => section.split('.')[0]))]
  const total = Object.values(vocabulary).reduce((sum, words) => sum + words.length, 0)
  assert.match(guide, new RegExp(`${total.toLocaleString('en-US')}个词汇`))
  assert.match(guide, new RegExp(`${Object.keys(vocabulary).length}个小节`))
  for (const chapter of chapters) assert.ok(guide.includes(`<th scope="row">第${chapter}章</th>`))
  assert.match(guide, /<h1[^>]*>王陆雅思语料库在线听写练习<\/h1>/)
  assert.match(guide, /空白行不计分/)
  assert.match(guide, /当前浏览器本地/)
  assert.match(guide, /仅供个人学习使用/)
  assert.equal(tags(guide, 'script').filter((tag) => attribute(tag, 'type') !== 'application/ld+json').length, 0)
})

test('static links resolve inside the deployment path and lead back to the app', () => {
  for (const tag of [...tags(guide, 'a'), ...tags(guide, 'link'), ...tags(guide, 'img')]) {
    const href = attribute(tag, 'href') ?? attribute(tag, 'src')
    if (!href || href.startsWith('https:') || href.startsWith('#')) continue
    const resolved = new URL(href, guideUrl)
    assert.ok(resolved.href.startsWith(homeUrl))
    const file = resolved.href === homeUrl ? 'index.html' : `public/${resolved.pathname.split('/').pop()}`
    assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), href)
  }
  assert.ok(home.includes('href="%BASE_URL%guide.html"'))
  assert.ok(home.includes('href="%BASE_URL%sitemap.xml"'))
})
