import he from 'he'
import yaml from 'js-yaml'
import stylis from 'stylis'

import { Matter } from './matter'

declare global {
  interface Window {
    Reveal: RevealStatic
    hljs: any
    revealMd: RevealMd
  }
}

export interface ISlide {
  id: string
  type: 'hidden' | 'global' | 'regular'
  html: string
  raw: string
}

export default class RevealMd {
  _headers: RevealOptions | null = null
  _queue: Array<(r?: RevealStatic) => void> = []
  _markdown: string = ''
  _raw: ISlide[][] = [[]]

  defaults = {
    reveal: {
      slideNumber: true,
      hash: true,
    },
  }

  cdn = 'https://cdn.jsdelivr.net/npm/reveal.js@3.8.0/'
  matter = new Matter()

  constructor(
    public makeHtml: (s: string, ext?: string) => string,
    /**
     * Must include '/' trailing at the end
     */
    cdn: string | null = null,
    placeholder: string = ''
  ) {
    window.revealMd = this

    this.cdn = cdn || this.cdn

    if (!this.cdn.includes('://')) {
      document.body.appendChild(
        Object.assign(document.createElement('script'), {
          src: `${this.cdn}js/reveal.js`,
        })
      )
    } else {
      document.body.appendChild(
        Object.assign(document.createElement('script'), {
          src: `${this.cdn}js/reveal.min.js`,
        })
      )
    }

    document.head.appendChild(
      Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: `${this.cdn}css/reveal.css`,
        type: 'text/css',
      })
    )

    document.head.appendChild(
      Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: `${this.cdn}css/theme/white.css`,
        type: 'text/css',
        id: 'reveal-theme',
      })
    )

    const { header, content } = this.matter.parse(placeholder)

    this.headers = header
    this.markdown = content

    const currentSlide = location.hash

    this.onReady(() => {
      if (currentSlide) {
        location.hash = currentSlide
      }
    })
  }

  get headers(): RevealOptions & {
    theme?: string
    title?: string
    type?: 'reveal'
    js?: string[]
    css?: string[]
  } {
    return this._headers || this.defaults.reveal
  }

  set headers(h) {
    let { theme, title, type, js, css, ...subH } = h

    this.theme = theme || 'white'
    this.title = title || ''

    subH = Object.assign(JSON.parse(JSON.stringify(this.defaults.reveal)), subH)

    if (dumpObj(this._headers) === dumpObj(subH)) {
      return
    }

    this.onReady((reveal) => {
      if (reveal) {
        reveal.configure(subH)
        reveal.slide(-1, -1, -1)
        reveal.sync()
      }
    })

    if (js) {
      js.map((src) => {
        const id = hash(src)

        if (!document.querySelector(`script#${id}`)) {
          document.body.append(
            Object.assign(document.createElement('script'), {
              id,
              src,
              async: true,
              className: 'reveal-md--custom-js',
            })
          )
        }
      })
    }

    if (css) {
      const ids = css.map((href) => {
        const id = hash(href)

        if (!document.querySelector(`link#${id}`)) {
          document.head.append(
            Object.assign(document.createElement('link'), {
              id,
              href,
              ref: 'stylesheet',
              className: 'reveal-md--custom-css',
            })
          )
        }

        return id
      })

      document.querySelectorAll('link.reveal-md--custom-css').forEach((el) => {
        if (ids.includes(el.id)) {
          el.remove()
        }
      })
    }

    this._headers = subH
  }

  get markdown() {
    return this._markdown
  }

  set markdown(s: string) {
    const globalEl = document.getElementById('global') as HTMLDivElement
    Array.from(globalEl.querySelectorAll('style.ref')).map((el) => el.remove())

    let xOffset = 0
    const newRaw = s
      .split(/\r?\n(?:===|---)\r?\n/g)
      .map((el, x) => {
        this._raw[x] = this._raw[x] || []
        const newRawSs = el
          .split(/\r?\n--\r?\n/g)
          .map((ss) => this.parseSlide(ss))
        if (newRawSs.every((ss) => !ss.html)) {
          xOffset++
        }

        x -= xOffset

        let yOffset = 0
        return newRawSs
          .map((thisRaw, y) => {
            if (!thisRaw.html) {
              yOffset++
              return
            }

            y -= yOffset

            let section = this.getSlide(x)
            let subSection = this.getSlide(x, y)

            if (
              !this._raw[x][y] ||
              (this._raw[x][y] && this._raw[x][y].raw !== thisRaw.raw)
            ) {
              const container = document.createElement('div')
              container.className = 'container'
              container.innerHTML = thisRaw.html

              if (section && subSection) {
                const oldContainers = subSection.getElementsByClassName(
                  'container'
                )
                Array.from(oldContainers).forEach((el) => el.remove())
                subSection.appendChild(container)
              } else {
                subSection = document.createElement('section')
                subSection.append(container)

                if (section) {
                  section.appendChild(subSection)
                } else {
                  section = document.createElement('section')
                  section.appendChild(subSection)
                  document
                    .querySelector('.reveal .slides')!
                    .appendChild(section)
                }
              }

              Array.from(
                container.querySelectorAll('pre code:not(.hljs)')
              ).forEach((el) => {
                if (window.hljs) {
                  window.hljs.highlightBlock(el)
                }
              })
            }

            return thisRaw
          })
          .filter((el) => el)
      })
      .filter((el) => el && el.length > 0) as ISlide[][]

    this._raw.map((el, x) => {
      el.map((_, j) => {
        const y = el.length - j - 1

        if (!newRaw[x] || !newRaw[x][y]) {
          const subSection = this.getSlide(x, y)
          if (subSection) {
            subSection.remove()
          }
        }
      })

      if (!newRaw[x]) {
        const section = this.getSlide(x)
        if (section) {
          section.remove()
        }
      }
    })

    this._raw = newRaw
  }

  get title() {
    const el = document.getElementsByTagName('title')[0]
    return el ? el.innerText : ''
  }

  set title(t) {
    let el = document.getElementsByTagName('title')[0]
    if (!el) {
      el = document.createElement('title')
      document.head.appendChild(el)
    }
    el.innerText = t
  }

  get theme() {
    const el = document.getElementById('reveal-theme') as HTMLLinkElement
    const m = /\/(\S+)\.css$/.exec(el.href)
    if (m) {
      return m[1]
    }

    return ''
  }

  set theme(t) {
    const el = document.getElementById('reveal-theme') as HTMLLinkElement
    el.href = `${this.cdn}css/theme/${t}.css`
  }

  update(raw: string) {
    const { header, content } = this.matter.parse(raw)
    this.markdown = content
    this.headers = header
  }

  onReady(fn?: (reveal?: RevealStatic) => void) {
    const reveal = window.Reveal
    if (reveal) {
      if (!(reveal as any).isReady()) {
        reveal.initialize({
          dependencies: [
            {
              src: `${this.cdn}plugin/highlight/highlight.js`,
              async: true,
            },
          ],
        })
        if (this._queue.length > 0) {
          this._queue.forEach((it) => it(reveal))
          reveal.slide(-1, -1, -1)
          reveal.sync()
        }
      }

      if (fn) {
        fn(reveal)
      }
    } else {
      if (fn) {
        this._queue.push(fn)
      }

      setTimeout(() => {
        this.onReady()
        const reveal = window.Reveal
        if (reveal) {
          reveal.slide(-1, -1, -1)
          reveal.sync()
        }
      }, 1000)
    }
  }

  parseSlide(text: string): ISlide {
    const id = hash(text)
    const raw = text
    let type: 'hidden' | 'global' | 'regular' = 'regular'
    let html = text
    const [firstLine, ...lines] = html.split('\n')
    const newType = firstLine.substr(3)
    if (newType === 'hidden') {
      type = 'hidden'
      return { html: '', raw, id, type }
    } else if (newType === 'global') {
      type = 'global'
      html = lines.join('\n')
    }

    html = html.replace(
      /(?:^|\n)\/\/ css=([A-Za-z0-9\-_]+\.css)(?:$|\n)/g,
      (p0, ref: string) => {
        const i = raw.indexOf(p0)
        const globalEl = document.getElementById('global') as HTMLDivElement
        const className = `ref${i}`

        let el = globalEl.querySelector(`style.ref.${className}`)
        if (!el) {
          el = document.createElement('style')
          el.classList.add('ref', className)
          globalEl.appendChild(el)
        }

        let url = ref
        if (!ref.includes('://')) {
          url = `/api/data?filename=${encodeURIComponent(ref)}`
        }

        fetch(url)
          .then((r) => r.text())
          .then((content) => {
            if (type !== 'global') {
              content = stylis(`#${id}`, content)
            }
            el!.innerHTML = content
          })

        return ''
      }
    )

    html = html.replace(
      /(?:^|\n)(\/\/ slide\n)?```(\S+)\n([^]+?)\n```(?:$|\n)/g,
      (p0, subtype, lang, content) => {
        if (type !== 'global' && !subtype) {
          return p0
        }

        if (lang === 'css') {
          const globalEl = document.getElementById('global') as HTMLDivElement
          if (type !== 'global') {
            content = stylis(`#${id}`, content)
          }
          let el = globalEl.querySelector('style.main')
          if (!el) {
            el = document.createElement('style')
            el.className = 'main'
            globalEl.appendChild(el)
          }
          el.innerHTML = content
          return ''
        } else if (lang === 'pre') {
          return `<pre>${he.encode(content)}</pre>`
        } else {
          return this.makeHtml(content, lang)
        }
      }
    )

    if (type === 'global') {
      document.body.insertAdjacentHTML('beforeend', html)
      return { html: '', raw, id, type }
    }

    return {
      html: `<div id="${id}">${this.makeHtml(html)}</div>`,
      raw,
      id,
      type,
    }
  }

  getSlide(x: number, y?: number) {
    const s = document.querySelectorAll('.slides > section')
    const hSlide = s[x]

    if (typeof y === 'number') {
      if (hSlide) {
        return Array.from(hSlide.children).filter(
          (el) => el.tagName.toLocaleUpperCase() === 'SECTION'
        )[y]
      }

      return undefined
    }

    return hSlide
  }
}

function hash(str: string) {
  var hash = 0
  for (var i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash = hash & hash
  }
  return 'h' + Math.round(Math.abs(hash)).toString(36)
}

function dumpObj(obj: any) {
  return yaml.safeDump(obj, {
    sortKeys: true,
    skipInvalid: true,
    indent: 0,
    noArrayIndent: true,
    flowLevel: 0,
  })
}
