import { flagsMeta } from './meta'

export function renderFlag(name: keyof typeof flagsMeta, size = 32) {
  const sx = 640
  const sy = 480
  let flag = ''
  const meta = flagsMeta[name] as {
    dir: 'H' | 'V'
    c?: string[]
    w?: number[]
    e?: Array<{
      n: 'path' | 'circle'
      fill?: number | string
      stroke?: number | string
      d?: string
      cx?: string
      cy?: string
      r?: string
    }>
    raw?: string
  }
  if (meta.c && !meta.w) {
    meta.w = meta.c.map(() => 1)
  }
  if (meta.c && meta.w) {
    const totalW = meta.w.reduce((a, b) => a + b, 0)
    let pos = 0
    for (let i = 0; i < meta.c.length; i++) {
      const c = meta.c[i]
      const w = meta.w[i]
      const length = meta.dir === 'V' ? sy : sx
      const baseWidth = meta.dir === 'V' ? sx : sy
      const width = (baseWidth / totalW) * w
      const center = pos + width / 2
      flag += `\n<path d="M${meta.dir === 'V' ? '' : '0 '}${center}${meta.dir === 'V' ? ' 0' : ''} ${meta.dir || 'H'} ${length}" stroke-width="${width}" stroke="${c}" />`
      pos += width
    }
  }
  if (meta.e) {
    for (const { n, d, fill, stroke, cx, cy, r } of meta.e) {
      const f =
        typeof fill === 'number'
          ? ` fill="${meta.c?.[fill]}"`
          : typeof fill === 'string'
            ? ` fill="${fill}"`
            : ''
      const s =
        typeof stroke === 'number'
          ? ` stroke="${meta.c?.[stroke]}"`
          : typeof stroke === 'string'
            ? ` stroke="${stroke}"`
            : ''
      if (n === 'path') {
        flag += `\n<path${f}${s} d="${d || ''}"/>`
      } else if (n === 'circle') {
        flag += `\n<circle${f}${s} cx="${cx || '0'}" cy="${cy || '0'}" r="${r || '0'}"/>`
      }
    }
  }
  if (meta.raw) {
    flag += `\n${meta.raw}`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${sx} ${sy}">${flag}    
</svg>`
}

// <svg xmlns="http://www.w3.org/2000/svg" width="42.67" height="32" viewBox="0 0 640 480"><path fill="#fff" d="M150.1 0h339.7v480H150z"/><path fill="#d52b1e" d="M-19.7 0h169.8v480H-19.7zm509.5 0h169.8v480H489.9zM201 232l-13.3 4.4l61.4 54c4.7 13.7-1.6 17.8-5.6 25l66.6-8.4l-1.6 67l13.9-.3l-3.1-66.6l66.7 8c-4.1-8.7-7.8-13.3-4-27.2l61.3-51l-10.7-4c-8.8-6.8 3.8-32.6 5.6-48.9c0 0-35.7 12.3-38 5.8l-9.2-17.5l-32.6 35.8c-3.5.9-5-.5-5.9-3.5l15-74.8l-23.8 13.4c-2 .9-4 .1-5.2-2.2l-23-46l-23.6 47.8c-1.8 1.7-3.6 1.9-5 .7L264 130.8l13.7 74.1c-1.1 3-3.7 3.8-6.7 2.2l-31.2-35.3c-4 6.5-6.8 17.1-12.2 19.5c-5.4 2.3-23.5-4.5-35.6-7c4.2 14.8 17 39.6 9 47.7z"/></svg>
