import React from 'react'
import fs from 'fs'
import path from 'path'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import GithubSlugger from 'github-slugger'

const GITHUB_BLOB = 'https://github.com/samfrons/storytimemaps/blob/main/'

export interface DocHeading {
  id: string
  text: string
}

export interface RepoDoc {
  /** The document's leading `# ` heading, which the page hero states instead. */
  title: string | null
  /** The document with that heading removed. */
  body: string
  /** Its `## ` sections, for a table of contents. */
  headings: DocHeading[]
}

/**
 * Strips inline Markdown from heading text so a table of contents entry reads
 * as prose, and so the slug computed here matches the one rehype-slug derives
 * from the rendered text rather than from the raw source.
 */
function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .trim()
}

/**
 * Collects the `## ` headings, ignoring anything inside a fenced code block —
 * a shell comment such as `## step two` in a setup snippet is not a section.
 */
function collectHeadings(markdown: string): DocHeading[] {
  const slugger = new GithubSlugger()
  const headings: DocHeading[] = []
  let inFence = false

  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = /^##\s+(.+?)\s*$/.exec(line)
    if (!match) continue

    const text = plainText(match[1])
    headings.push({ id: slugger.slug(text), text })
  }

  return headings
}

/**
 * Reads a Markdown file from anywhere in the repo and prepares it for display.
 *
 * The Markdown files stay the single source of truth. A contributor reading
 * the guide on the site and a maintainer editing it in the repo see the same
 * words, and the page cannot drift from the document.
 *
 * Read at request time from the repo (not /public): these are build inputs,
 * not static assets. Pages using this set `force-dynamic`, so a file that is
 * moved or removed degrades to a message on the page instead of failing a
 * production build.
 *
 * @param relativePath path from the repo root, e.g. `docs/ONBOARDING.md`
 */
export function readRepoDoc(relativePath: string): RepoDoc | null {
  let raw: string
  try {
    raw = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
  } catch {
    return null
  }

  const titleMatch = /^\s*#\s+(.+?)\s*$/m.exec(raw.split('\n').slice(0, 3).join('\n'))
  const body = titleMatch ? raw.replace(/^\s*#\s+.*\n/, '') : raw

  return {
    title: titleMatch ? plainText(titleMatch[1]) : null,
    body,
    headings: collectHeadings(body),
  }
}

/**
 * Where each repo document is published on the site.
 *
 * A guide that links to `./TASK_TRACKING.md` is correct in the repo but a dead
 * end in a browser, so those links are rewritten to the page that renders the
 * same file. Anything not published here still resolves — to the file on
 * GitHub — rather than 404ing.
 */
const DOC_ROUTES: Readonly<Record<string, string>> = {
  'ONBOARDING.md': '/onboarding',
  'THEMING_GUIDE.md': '/onboarding/theming',
  'OUTREACH_TRACKING.md': '/onboarding/outreach',
  'TASK_TRACKING.md': '/onboarding/tasks',
  'STYLE.md': '/onboarding/style',
  'PERFORMANCE_RULES.md': '/onboarding/performance',
}

export function resolveDocHref(href: string): string {
  // In-page anchors, mail links and absolute URLs are already usable.
  if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) return href
  if (!href.includes('.md')) return href

  const [target, hash] = href.split('#')
  const published = DOC_ROUTES[path.basename(target)]
  if (published) return hash ? `${published}#${hash}` : published

  return GITHUB_BLOB + target.replace(/^\.\//, '').replace(/^\.\.\//, '')
}

/**
 * Renders repo Markdown in the site's document style.
 *
 * Shares the `workbook-prose` styles with the teaching documents so every
 * long-form document on the site — a lesson plan, a contributor guide — reads
 * as the same kind of object.
 */
const MarkdownDocument: React.FC<{ markdown: string }> = ({ markdown }) => (
  <article className="workbook-prose">
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
      components={{
        // Reference tables are wide; without this wrapper they push the whole
        // page into horizontal scroll on a phone.
        //
        // `node` (react-markdown's hast element) is destructured out and
        // discarded, not spread — spreading it onto a real <table> passes an
        // object as a DOM attribute, which React warns about on every render.
        table: ({ node: _node, children, ...props }) => (
          <div className="workbook-table-scroll">
            <table {...props}>{children}</table>
          </div>
        ),
        a: ({ node: _node, href, children, ...props }) => {
          const resolved = resolveDocHref(href ?? '')
          const external = /^https?:/i.test(resolved)
          return (
            <a
              href={resolved}
              {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              {...props}
            >
              {children}
            </a>
          )
        },
      }}
    >
      {markdown}
    </Markdown>
  </article>
)

export default MarkdownDocument
