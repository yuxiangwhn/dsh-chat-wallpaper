// dsh-chat-wallpaper — browser half.
//
// Paints one local image behind the chat UI, keeps the app surfaces glassy, and
// adds a small control cluster in the sidebar footer (brightness / opacity /
// frosted blur / panel glass) plus automatic frosted blur on a fresh page.
//
// Everything is wrapped: a failure may cost the controls, never the page.
;(function () {
  'use strict'

  const LAYER_ID = '__dsh_chat_wallpaper__'
  const STYLE_ID = '__dsh_chat_wallpaper_css__'
  const DOCK_ID = '__dsh_chat_wallpaper_dock__'
  const POP_ID = '__dsh_chat_wallpaper_pop__'
  const FROST_ID = '__dsh_chat_wallpaper_frost__'
  const STORE_KEY = 'dsh-chat-wallpaper:settings:v1'
  const IMAGE = '__WALL_DATA_URL__'

  const DEFAULTS = { brightness: 1.60, opacity: 1, blur: 0, panel: 0.45 }

  function clamp(n, lo, hi, fallback) {
    const v = Number(n)
    return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      return {
        brightness: clamp(raw.brightness, 0.5, 2.2, DEFAULTS.brightness),
        opacity: clamp(raw.opacity, 0.15, 1, DEFAULTS.opacity),
        blur: clamp(raw.blur, 0, 24, DEFAULTS.blur),
        panel: clamp(raw.panel, 0.15, 0.98, DEFAULTS.panel),
      }
    } catch {
      return { ...DEFAULTS }
    }
  }

  let settings = load()

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)) } catch {}
  }

  function applyVars() {
    const root = document.documentElement
    try {
      root.style.setProperty('--wall-brightness', String(settings.brightness))
      root.style.setProperty('--wall-opacity', String(settings.opacity))
      root.style.setProperty('--wall-blur', settings.blur + 'px')
      root.style.setProperty('--wall-panel', String(settings.panel))
      root.style.setProperty('--wall-scale', String(1 + Math.min(settings.blur, 24) / 120))
    } catch {}
  }

  const CSS = `
html, body { background: transparent !important; }
#${LAYER_ID} {
  position: fixed; inset: -40px; z-index: 0; pointer-events: none;
  background-color: #0a1424;
  overflow: hidden;
  opacity: var(--wall-opacity, 1);
  filter: brightness(var(--wall-brightness, 1.60)) blur(calc(var(--wall-blur, 0px) + var(--wall-blur-extra, 0px)));
  transform: scale(var(--wall-scale, 1));
  transition: filter .45s cubic-bezier(.22,.61,.36,1), opacity .25s ease, transform .45s cubic-bezier(.22,.61,.36,1);
}
#${LAYER_ID}::after {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(135% 100% at 50% 0%,
    rgba(4,9,18,.00) 0%, rgba(4,9,18,.10) 60%, rgba(3,7,14,.24) 100%);
}
body[data-ds-dark-theme] #${LAYER_ID}::after {
  background: radial-gradient(135% 100% at 50% 0%,
    rgba(2,6,13,.02) 0%, rgba(2,6,13,.14) 60%, rgba(1,4,9,.30) 100%);
}

/* one translucent shell; nested fills must not compound */
body {
  --dsw-alias-bg-base: rgba(255,255,255,calc(var(--wall-panel, .72) * 1.12)) !important;
  --dsw-alias-bg-layer-1: rgba(255,255,255,calc(var(--wall-panel, .72) * 1.12)) !important;
  --dsw-alias-bg-layer-2: rgba(255,255,255,calc(var(--wall-panel, .72) * 1.12)) !important;
  --dsw-alias-bg-layer-3: rgba(255,255,255,calc(var(--wall-panel, .72) * 1.12)) !important;
  --dsw-alias-bg-module-platform: rgba(245,246,247,calc(var(--wall-panel, .72) * 1.16)) !important;
  --dsw-alias-bg-multi-select: rgba(245,246,247,calc(var(--wall-panel, .72) * 1.16)) !important;
  --dsw-alias-bg-overlay: rgba(233,236,242,.97) !important;
  --dsw-specific-sidebar-fill: rgba(249,250,251,calc(var(--wall-panel, .72) * 1.04)) !important;
  --dsw-specific-selector: rgba(245,246,247,calc(var(--wall-panel, .72) * 1.16)) !important;
}
body[data-ds-dark-theme] {
  --dsw-alias-bg-base: rgba(9,12,16,var(--wall-panel, .72)) !important;
  --dsw-alias-bg-layer-1: rgba(12,16,22,var(--wall-panel, .72)) !important;
  --dsw-alias-bg-layer-2: rgba(16,20,27,var(--wall-panel, .72)) !important;
  --dsw-alias-bg-layer-3: rgba(20,25,33,var(--wall-panel, .72)) !important;
  --dsw-alias-bg-module-platform: rgba(13,17,23,calc(var(--wall-panel, .72) * 1.03)) !important;
  --dsw-alias-bg-multi-select: rgba(13,17,23,calc(var(--wall-panel, .72) * 1.03)) !important;
  --dsw-alias-bg-overlay: rgba(18,22,30,.96) !important;
  --dsw-specific-sidebar-fill: rgba(11,15,21,calc(var(--wall-panel, .72) * .94)) !important;
  --dsw-specific-selector: rgba(13,17,23,calc(var(--wall-panel, .72) * 1.03)) !important;
}

/* DSH Desktop owns two independently painted conversation layers */
body:is([data-dsh-desktop-mode="advanced"],[data-dsh-desktop-mode="extended"]) .dshDesktopFrame {
  background: var(--dsw-alias-bg-base) !important;
}
body:is([data-dsh-desktop-mode="advanced"],[data-dsh-desktop-mode="extended"]) .dshDesktopSidebarSurface {
  --dsw-specific-sidebar-fill: transparent !important;
}
body:is([data-dsh-desktop-mode="advanced"],[data-dsh-desktop-mode="extended"]) :is(
  .dshDesktopSidebarSurface, .dshDesktopConversationSurface, .dshDesktopDetailsSurface,
  .dshDesktopMacCaptionRow, .dshDesktopWindowsCaptionRow,
  .dshDesktopConversationSurface > *, .dshDesktopConversationSurface [data-phase="hero"],
  .dshDesktopConversationSurface [data-phase="active"],
  .dshDesktopConversationSurface [data-phase="settling"],
  .dshDesktopDetailsSurface > *
) { background: transparent !important; }
/* Exactly one surface paints the window chrome. The frame covers the caption
   strip, the sidebar and the 16px notch beside the conversation surface, so the
   notch is the same translucent layer as the chrome around it instead of a
   square block in a third colour. The columns and the caption strip stay
   transparent so their fill cannot stack up on the frame's. */
html:is([data-platform="darwin"],[data-windows-titlebar]) body #root div:has(> [data-shell-overlay]) {
  background: var(--dsw-specific-sidebar-fill) !important;
}
html:is([data-platform="darwin"],[data-windows-titlebar]) body .mP3x-q_frame:before,
html:is([data-platform="darwin"],[data-windows-titlebar]) body .mP3x-q_sidebarCol,
html:is([data-platform="darwin"],[data-windows-titlebar]) body .mP3x-q_centerCol {
  background: transparent !important;
}
html:is([data-platform="darwin"],[data-windows-titlebar]) body #root div:has(> [data-shell-overlay]) > :first-child [data-slot="sidebar"] {
  --dsw-specific-sidebar-fill: transparent !important;
}

/* ---------- control cluster ---------- */
#${DOCK_ID} {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; margin: 0 2px; flex: 0 0 auto;
  border-radius: 6px; border: 0; padding: 0; cursor: pointer;
  background: transparent; color: var(--dsw-alias-label-secondary, #8a90a0);
  transition: background .15s ease, color .15s ease;
}
#${DOCK_ID}:hover { background: rgba(127,127,127,.16); color: var(--dsw-alias-label-primary, #e8eaf0); }
#${DOCK_ID} svg { width: 15px; height: 15px; display: block; }
#${DOCK_ID}[data-floating="1"] {
  position: fixed; right: 46px; bottom: 92px; z-index: 40;
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2, rgba(20,24,32,.9));
  box-shadow: 0 2px 10px rgba(0,0,0,.35);
}
#${POP_ID} {
  position: fixed; z-index: 60; width: 236px; box-sizing: border-box;
  padding: 12px 12px 10px; border-radius: 12px;
  background: var(--dsw-alias-bg-overlay, rgba(20,24,32,.97));
  color: var(--dsw-alias-label-primary, #e8eaf0);
  border: 1px solid rgba(127,127,127,.22);
  box-shadow: 0 12px 32px rgba(0,0,0,.42);
  font: 12px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
  backdrop-filter: blur(14px) saturate(1.1);
}
#${POP_ID} .w-row { display: grid; grid-template-columns: 46px 1fr 38px; gap: 8px; align-items: center; margin: 7px 0; }
#${POP_ID} .w-lab { opacity: .78; white-space: nowrap; }
#${POP_ID} .w-val { text-align: right; opacity: .62; font-variant-numeric: tabular-nums; }
#${POP_ID} input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 3px; border-radius: 3px; background: rgba(127,127,127,.34); outline: none; }
#${POP_ID} input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #4d8dff; border: 0; cursor: pointer; }
#${POP_ID} .w-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
#${POP_ID} .w-title { font-weight: 600; opacity: .92; }
#${POP_ID} .w-close { border: 0; background: transparent; color: inherit; opacity: .5; cursor: pointer; font-size: 14px; line-height: 1; padding: 2px 4px; }
#${POP_ID} .w-close:hover { opacity: .9; }
#${POP_ID} .w-foot { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(127,127,127,.16); }
#${POP_ID} .w-foot .w-reset { margin-left: auto; }
#${POP_ID} .w-switch { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; opacity: .82; }
#${POP_ID} .w-btn {
  border: 1px solid rgba(127,127,127,.28); background: rgba(127,127,127,.10);
  color: inherit; border-radius: 7px; padding: 4px 9px; font-size: 12px; cursor: pointer;
}
#${POP_ID} .w-btn:hover { background: rgba(127,127,127,.22); }
#${POP_ID} .w-reset { border: 0; background: transparent; color: #6ea2ff; cursor: pointer; padding: 0; font-size: 12px; }
#${POP_ID} .w-hint { font-size: 11px; opacity: .55; }

/* a stacked window is open: everything behind it is frosted, the window in
   front keeps its own crisp pixels */
#${FROST_ID} {
  position: fixed;
  inset: 0;
  z-index: 990;
  pointer-events: none;
  opacity: 0;
  transition: opacity 60ms linear;
  background: rgba(11, 15, 21, 0.18);
}
#${FROST_ID}.on { opacity: 1; }
body.wall-modal #${LAYER_ID}_img {
  filter: blur(16px) saturate(1.08) brightness(1.06);
  transform: scale(1.05);
}
body.wall-modal [data-wall-blur] {
  filter: blur(8px) saturate(1.03);
}

/* the composer card and the new-chat button sit on the wallpaper: let its
   colour through, softened by their own blur */
[data-wall-glass] {
  background: rgba(18, 22, 30, 0.42) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
  -webkit-backdrop-filter: blur(18px) saturate(1.35);
  backdrop-filter: blur(18px) saturate(1.35);
}
body:not([data-ds-dark-theme]) [data-wall-glass] {
  background: rgba(255, 255, 255, 0.42) !important;
  border-color: rgba(0, 0, 0, 0.08) !important;
}

/* the user's own message bubbles need a visible edge, otherwise the glass
   dissolves into a dark wallpaper */
[data-wall-glass="user"] {
  background: rgba(24, 29, 39, 0.55) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.10), 0 2px 10px rgba(0, 0, 0, 0.22) !important;
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
  backdrop-filter: blur(18px) saturate(1.4);
}
body:not([data-ds-dark-theme]) [data-wall-glass="user"] {
  background: rgba(255, 255, 255, 0.55) !important;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.10), 0 2px 10px rgba(0, 0, 0, 0.10) !important;
}
`

  function ensureStyle() {
    // always replace: the app re-applies plugins without reloading the page, so
    // a style element from an earlier apply would otherwise win over new rules
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    try { document.getElementById(STYLE_ID)?.remove() } catch {}
    ;(document.head || document.documentElement).appendChild(style)
  }

  function ensureLayer() {
    if (!document.body) return
    let layer = document.getElementById(LAYER_ID)
    if (!layer) {
      layer = document.createElement('div')
      layer.id = LAYER_ID
      layer.setAttribute('aria-hidden', 'true')
    }
    if (!layer.querySelector('img')) {
      const img = document.createElement('img')
      img.id = LAYER_ID + '_img'
      img.alt = ''
      img.decoding = 'async'
      img.src = IMAGE
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
        + 'object-fit:cover;object-position:center 38%;display:block;'
      layer.appendChild(img)
    }
    if (document.body.firstElementChild !== layer) {
      document.body.insertBefore(layer, document.body.firstChild)
    }
  }

  // ---------- anchor ----------
  function locateRow() {
    // preferred: the sidebar footer action toolbar (the row at the bottom of
    // the sidebar that holds the small action icons)
    const actions = document.querySelectorAll('[data-slot="sidebar.footer.action"]')
    if (actions.length) {
      const last = actions[actions.length - 1]
      const parent = last.parentElement
      if (parent && parent.children.length >= 1) return parent
    }
    const sidebar = document.querySelector('[data-slot="sidebar"]')
    const scope = sidebar || document.body
    const box = scope.getBoundingClientRect()
    if (!box.width || !box.height) return null
    let best = null
    let bestScore = -Infinity
    const all = scope.querySelectorAll('div, section, footer, nav, ul')
    const nodes = all.length > 500 ? [...all].slice(-500) : all
    for (const el of nodes) {
      const r = el.getBoundingClientRect()
      if (r.width < 60 || r.height < 18 || r.height > 56) continue
      if (r.bottom < box.bottom - 240 || r.bottom > box.bottom + 4) continue
      if (!el.querySelector('svg')) continue
      let score = 0
      score += Math.min(r.bottom, box.bottom) // lower is better
      score -= Math.abs(r.height - 30) * 2
      const icons = el.querySelectorAll('svg').length
      if (icons >= 1 && icons <= 5) score += 20
      if (icons >= 2) score += 60
      if (r.width > box.width * 0.7) score += 25
      if (el.querySelector('img')) score -= 160
      if (el.getAttribute('role') === 'toolbar') score += 40
      if (score > bestScore) { bestScore = score; best = el }
    }
    return best
  }

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18"/></svg>'

  function buildDock(floating) {
    const btn = document.createElement('button')
    btn.id = DOCK_ID
    btn.type = 'button'
    btn.title = '聊天背景设置'
    btn.setAttribute('aria-label', '聊天背景设置')
    if (floating) btn.dataset.floating = '1'
    btn.innerHTML = ICON
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      togglePopover(btn)
    })
    return btn
  }


  // ---------- custom image (IndexedDB; a data URL would blow localStorage) ----------
  const DB_NAME = 'dsh-chat-wallpaper'
  let customUrl = null

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => { req.result.createObjectStore('kv') }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  async function dbPut(blob) {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').put(blob, 'image')
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  }

  async function dbGet() {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly')
      const req = tx.objectStore('kv').get('image')
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  }

  async function dbDel() {
    const db = await openDb()
    await new Promise((resolve) => {
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').delete('image')
      tx.oncomplete = resolve
      tx.onerror = resolve
    })
  }

  function setLayerImage(src) {
    const img = document.getElementById(LAYER_ID + '_img')
    if (!img) return
    img.src = src
  }

  async function loadCustomImage() {
    try {
      const blob = await dbGet()
      if (blob) {
        if (customUrl && customUrl.startsWith('blob:')) URL.revokeObjectURL(customUrl)
        customUrl = URL.createObjectURL(blob)
        setLayerImage(customUrl)
        return true
      }
    } catch {}
    try {
      const stored = localStorage.getItem('dsh-chat-wallpaper:image')
      if (stored) { customUrl = stored; setLayerImage(stored); return true }
    } catch {}
    return false
  }

  async function useImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return false
    try {
      await dbPut(file)
      if (await loadCustomImage()) return true
    } catch {}
    // fallback for origins where IndexedDB is blocked
    try {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
      if (dataUrl && dataUrl.length < 4.5e6) {
        localStorage.setItem('dsh-chat-wallpaper:image', dataUrl)
        customUrl = dataUrl
        setLayerImage(dataUrl)
        return true
      }
    } catch {}
    return false
  }

  async function resetImage() {
    try { await dbDel() } catch {}
    try { localStorage.removeItem('dsh-chat-wallpaper:image') } catch {}
    if (customUrl) { URL.revokeObjectURL(customUrl); customUrl = null }
    setLayerImage(IMAGE)
  }

  // The footer row lays its two action buttons out with space-between, so an
  // extra flex child would sit at an end. Pin the control absolutely instead:
  // 30px to the left of the right-hand (grid) icon, vertically centred.
  function positionInRow(row, dock) {
    try {
      const btns = [...row.querySelectorAll('button')].filter((b) => b.id !== DOCK_ID)
      if (!btns.length) return false
      const grid = row.querySelector('button[data-dsh-plugin=remote-bridge]') || btns[btns.length - 1]
      if (getComputedStyle(row).position === 'static') row.style.position = 'relative'
      const rr = row.getBoundingClientRect()
      const ar = grid.getBoundingClientRect()
      if (!rr.width || !ar.width) return false
      dock.style.position = 'absolute'
      dock.style.left = Math.round(ar.left - rr.left - 30) + 'px'
      dock.style.top = Math.round(ar.top - rr.top + ar.height / 2 - 12) + 'px'
      return true
    } catch { return false }
  }

  function ensureDock() {
    if (!document.body) return
    let dock = document.getElementById(DOCK_ID)
    if (!dock) dock = buildDock(false)
    const row = locateRow()
    if (row && positionInRow(row, dock)) {
      if (dock.parentElement !== row) row.appendChild(dock)
      dock.removeAttribute('data-floating')
    } else if (row) {
      if (dock.parentElement !== row) row.insertBefore(dock, row.lastElementChild || null)
      dock.removeAttribute('data-floating')
    } else {
      if (dock.parentElement !== document.body) document.body.appendChild(dock)
      dock.dataset.floating = '1'
      dock.style.position = ''
      dock.style.left = ''
      dock.style.top = ''
    }
  }

  // ---------- popover ----------
  let pop = null

  function row(label, key, min, max, step, format) {
    const wrap = document.createElement('div')
    wrap.className = 'w-row'
    const lab = document.createElement('span')
    lab.className = 'w-lab'
    lab.textContent = label
    const input = document.createElement('input')
    input.type = 'range'
    input.min = String(min)
    input.max = String(max)
    input.step = String(step)
    input.value = String(settings[key])
    const val = document.createElement('span')
    val.className = 'w-val'
    const show = () => { val.textContent = format(settings[key]) }
    input.addEventListener('input', () => {
      settings[key] = Number(input.value)
      applyVars()
      show()
      save()
    })
    show()
    wrap.append(lab, input, val)
    return { wrap, input, show }
  }

  function buildPopover(anchor) {
    const el = document.createElement('div')
    el.id = POP_ID

    const head = document.createElement('div')
    head.className = 'w-head'
    const title = document.createElement('span')
    title.className = 'w-title'
    title.textContent = '聊天背景'
    const close = document.createElement('button')
    close.className = 'w-close'
    close.type = 'button'
    close.textContent = '✕'
    close.addEventListener('click', () => hidePopover())
    head.append(title, close)

    const r1 = row('亮度', 'brightness', 0.5, 2.2, 0.05, (v) => Math.round(v * 100) + '%')
    const r2 = row('透明度', 'opacity', 0.15, 1, 0.05, (v) => Math.round(v * 100) + '%')
    const r3 = row('磨砂', 'blur', 0, 24, 1, (v) => Math.round(v) + 'px')
    const r4 = row('面板', 'panel', 0.15, 0.98, 0.02, (v) => Math.round(v * 100) + '%')

    const imgRow = document.createElement('div')
    imgRow.className = 'w-row'
    const imgLab = document.createElement('span')
    imgLab.className = 'w-lab'
    imgLab.textContent = '图片'
    const imgBtns = document.createElement('div')
    imgBtns.style.cssText = 'grid-column: 2 / span 2; display: flex; gap: 6px; justify-content: flex-end;'
    const pickBtn = document.createElement('button')
    pickBtn.type = 'button'
    pickBtn.className = 'w-btn'
    pickBtn.textContent = '选择图片…'
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.style.display = 'none'
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0]
      fileInput.value = ''
      if (file && await useImageFile(file)) pickBtn.textContent = '已更换 ✓'
      else pickBtn.textContent = '失败，重试'
      setTimeout(() => { pickBtn.textContent = '选择图片…' }, 1800)
    })
    pickBtn.addEventListener('click', () => fileInput.click())
    const defBtn = document.createElement('button')
    defBtn.type = 'button'
    defBtn.className = 'w-btn'
    defBtn.textContent = '默认'
    defBtn.addEventListener('click', async () => { await resetImage(); defBtn.textContent = '已恢复 ✓'; setTimeout(() => { defBtn.textContent = '默认' }, 1200) })
    imgBtns.append(pickBtn, defBtn)
    imgRow.append(imgLab, imgBtns, document.createElement('span'))

    const foot = document.createElement('div')
    foot.className = 'w-foot'
    const hint = document.createElement('span')
    hint.className = 'w-hint'
    hint.textContent = '对话有内容后磨砂 +5px'
    const reset = document.createElement('button')
    reset.className = 'w-reset'
    reset.type = 'button'
    reset.textContent = '重置'
    reset.addEventListener('click', () => {
      settings = { ...DEFAULTS }
      r1.input.value = String(settings.brightness); r1.show()
      r2.input.value = String(settings.opacity); r2.show()
      r3.input.value = String(settings.blur); r3.show()
      r4.input.value = String(settings.panel); r4.show()
      applyVars(); save(); syncTyping()
    })
    foot.append(hint, reset)
    el.append(head, r1.wrap, r2.wrap, r3.wrap, r4.wrap, imgRow, fileInput, foot)

    const r = anchor.getBoundingClientRect()
    const width = 236
    const height = 252
    let left = r.left + r.width / 2 - width / 2
    let top = r.top - height - 8
    left = Math.max(8, Math.min(window.innerWidth - width - 8, left))
    if (top < 8) top = r.bottom + 8
    el.style.left = Math.round(left) + 'px'
    el.style.top = Math.round(top) + 'px'

    const outside = (ev) => {
      if (pop && !pop.contains(ev.target) && !anchor.contains(ev.target)) hidePopover()
    }
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0)

    return { el, outside }
  }

  function togglePopover(anchor) {
    if (pop) { hidePopover(); return }
    try {
      const built = buildPopover(anchor)
      pop = built.el
      pop.__outside = built.outside
      document.body.appendChild(pop)
    } catch (e) { pop = null }
  }

  function hidePopover() {
    if (!pop) return
    try { document.removeEventListener('mousedown', pop.__outside, true) } catch {}
    try { pop.remove() } catch {}
    pop = null
  }

  // ---------- stacked window ----------
  // When another window sits on top of the chat, everything painted beneath it
  // is frosted: a fixed layer with backdrop-filter is inserted directly below
  // the window that owns the front of the stacking order, so the window in
  // front keeps its own crisp pixels.
  let lastModalSig = ''

  function chatPanel() {
    return document.querySelector('.mP3x-q_mainPanel') || document.querySelector('[data-slot="main"]')
  }

  function findOverlay() {
    const W = innerWidth || 1
    const H = innerHeight || 1
    const panel = chatPanel()
    const main = document.querySelector('[data-slot="main"]')
    const pts = []
    for (let iy = 1; iy <= 4; iy++) {
      for (let ix = 1; ix <= 5; ix++) pts.push([(W * ix) / 6, (H * iy) / 5])
    }
    let best = null
    for (const [x, y] of pts) {
      let n = null
      try { n = document.elementFromPoint(x, y) } catch { n = null }
      let depth = 0
      while (n && n !== document.body && depth < 14) {
        try {
          if (n.id === FROST_ID || n.id === LAYER_ID || n.id === DOCK_ID) break
          if (n.closest && n.closest('#' + POP_ID)) break
          const cs = getComputedStyle(n)
          if (cs.position === 'fixed' || cs.position === 'absolute') {
            const b = n.getBoundingClientRect()
            const area = b.width * b.height
            const holdsChat = (panel && n.contains(panel)) || (main && n.contains(main))
            // a menu anchored inside the composer (the "/" palette) is not a
            // window: windows are portals on <body>, or fill the viewport
            const inComposer = !!(n.closest && n.closest('[class*="GRgSLq_root"]'))
            const portal = n.parentElement === document.body
            const windowish = portal && area > W * H * 0.2
            const huge = area > W * H * 0.65
            if ((windowish || huge) && !holdsChat && !inComposer) {
              const zi = parseInt(cs.zIndex, 10)
              const z = Number.isFinite(zi) ? zi : 0
              const cand = {
                el: n,
                zi: z,
                sig: n.tagName + '.' + String(n.className).slice(0, 48) + '|z' + z,
              }
              if (!best || cand.zi >= best.zi) best = cand
              break
            }
          }
        } catch {}
        n = n.parentElement
        depth++
      }
    }
    return best
  }



  let lastOverlay = null
  let blurHosts = []

  function clearBlurHosts() {
    for (const el of blurHosts) { try { el.removeAttribute('data-wall-blur') } catch {} }
    blurHosts = []
  }

  // `display: contents` wrappers have no box, so a filter on them does nothing:
  // skip them while looking for the widest element we may safely blur.
  function pickHost(overlay, from) {
    let best = null
    let n = from
    while (n && n !== document.body) {
      if (n.contains(overlay)) break
      let ok = false
      try {
        const cs = getComputedStyle(n)
        const r = n.getBoundingClientRect()
        ok = cs.display !== 'contents'
          && r.width > innerWidth * 0.4 && r.height > innerHeight * 0.3
      } catch {}
      if (ok) best = n
      if (n.id === 'root') break
      n = n.parentElement
    }
    return best
  }

  // The frost must cover as much of this window as possible without touching the
  // window in front, so tag the widest ancestor that does not contain it.
  function decorateBlurTargets(overlay) {
    clearBlurHosts()
    if (!overlay) return
    try {
      const sidebar = document.querySelector('.mP3x-q_sidebarCol') || document.querySelector('[data-slot="sidebar"]')
      const main = document.querySelector('.mP3x-q_mainPanel') || document.querySelector('[data-slot="main"]')
      if (!sidebar || !main) return
      let lca = sidebar
      while (lca && !lca.contains(main)) lca = lca.parentElement
      if (!lca) return
      const host = pickHost(overlay, lca)
      const tag = host ? [host] : [sidebar, main]
      if (host && host.parentElement) {
        // a title bar that sits outside the host would leave a hard seam
        const top = host.getBoundingClientRect().top
        for (const sib of host.parentElement.children) {
          if (sib === host || sib.id === FROST_ID) continue
          if (sib.contains(overlay) || sib.contains(host)) continue
          try {
            const cs = getComputedStyle(sib)
            const r = sib.getBoundingClientRect()
            if (cs.display === 'contents') continue
            if (r.width > innerWidth * 0.5 && r.height > 0 && r.height < 160 && r.top < top + 2) tag.push(sib)
          } catch {}
        }
      }
      // the app menu and the window controls are portals on body: they would
      // otherwise stay razor sharp above the frost
      for (const kid of document.body.children) {
        if (!kid || kid === host) continue
        if (kid.id === FROST_ID || kid.id === LAYER_ID || kid.id === POP_ID || kid.id === DOCK_ID) continue
        if (kid.contains(overlay)) continue
        try {
          const cs = getComputedStyle(kid)
          if (cs.position !== 'fixed' && cs.position !== 'absolute') continue
          const r = kid.getBoundingClientRect()
          if (r.width <= 0 || r.height <= 0 || r.height > 90) continue
          if (r.top > 12) continue
          tag.push(kid)
        } catch {}
      }
      for (const el of tag) {
        try { el.setAttribute('data-wall-blur', '1'); blurHosts.push(el) } catch {}
      }
    } catch {}
  }

  // The composer card, the new-chat button and the user's own message bubbles
  // sit directly on the wallpaper, so they are tagged for the glass treatment.
  function decorateGlass() {
    try {
      const card = document.querySelector('.GRgSLq_card')
      if (card && !card.hasAttribute('data-wall-glass')) card.setAttribute('data-wall-glass', 'composer')
      for (const b of document.querySelectorAll(
        '[class*="userRow"] [class*="bubble"], [class*="userStack"] [class*="bubble"]')) {
        if (!b.hasAttribute('data-wall-glass')) b.setAttribute('data-wall-glass', 'user')
      }
      const sidebar = document.querySelector('.mP3x-q_sidebarCol') || document.querySelector('[data-slot="sidebar"]')
      if (!sidebar) return
      if (sidebar.querySelector('[data-wall-glass="newchat"]')) return
      for (const b of sidebar.querySelectorAll('button')) {
        const r = b.getBoundingClientRect()
        if (r.top > 220 || r.width < 150) continue
        if (!(b.innerText || '').trim()) continue
        b.setAttribute('data-wall-glass', 'newchat')
        return
      }
    } catch {}
  }

  function syncModal(immediate) {
    const body = document.body
    if (!body) return
    let found = null
    try { found = findOverlay() } catch {}
    let frost = document.getElementById(FROST_ID)
    if (found) {
      const el = found.el
      const parent = el.parentElement || body
      if (!frost) {
        frost = document.createElement('div')
        frost.id = FROST_ID
        frost.setAttribute('aria-hidden', 'true')
      }
      if (frost.parentElement !== parent || frost.nextElementSibling !== el) {
        try { parent.insertBefore(frost, el) } catch { try { body.appendChild(frost) } catch {} }
      }
      frost.style.zIndex = String(found.zi > 0 ? found.zi - 1 : 989)
      frost.classList.add('on')
      body.classList.add('wall-modal')
      if (lastOverlay !== el) {
        lastOverlay = el
        decorateBlurTargets(el)
      }
    } else {
      if (frost) { try { frost.remove() } catch {} }
      if (body.classList.contains('wall-modal')) body.classList.remove('wall-modal')
      if (lastOverlay) { lastOverlay = null; clearBlurHosts() }
    }
    const sig = found ? found.sig : ''
    if (sig !== lastModalSig) {
      lastModalSig = sig
      try { setTimeout(() => postProbe(), 350) } catch {}
    }
  }

  // The topmost element at a few fixed points is a cheap proxy for "did the
  // stacking order change": the full overlay scan only runs when it differs.
  function topsig() {
    const W = innerWidth || 1
    const H = innerHeight || 1
    const out = []
    for (const [x, y] of [[W * 0.5, H * 0.5], [W * 0.5, H * 0.2], [W * 0.2, H * 0.5],
      [W * 0.8, H * 0.5], [W * 0.35, H * 0.75], [W * 0.65, H * 0.25]]) {
      let n = null
      try { n = document.elementFromPoint(x, y) } catch {}
      out.push(n ? n.tagName + '/' + (n.id || '') + '/' + String(n.className).slice(0, 32) : '-')
    }
    return out.join('|')
  }

  // ---------- wallpaper blur on activity ----------
  // A pristine new conversation keeps the wallpaper at the configured blur.
  // As soon as it has text in the composer — or a message already sent — the
  // wallpaper gains 5px and keeps it for the rest of that conversation.
  function composerInput() {
    return document.querySelector('.GRgSLq_card textarea, .GRgSLq_card [contenteditable="true"]')
      || document.querySelector('textarea, [contenteditable="true"]')
  }

  function composerHasText() {
    const el = composerInput()
    if (!el) return false
    const raw = el.tagName === 'TEXTAREA' ? (el.value || '') : (el.innerText || el.textContent || '')
    return raw.trim().length > 0
  }

  function conversationHasMessages() {
    return !!document.querySelector('[class*="userRow"] [class*="bubble"]')
  }

  let lastActive = null
  function syncTyping() {
    const active = composerHasText() || conversationHasMessages()
    if (active === lastActive) return
    lastActive = active
    try {
      document.documentElement.style.setProperty('--wall-blur-extra', active ? '5px' : '0px')
    } catch {}
    try { document.body.classList.toggle('wall-active', active) } catch {}
  }

  // ---------- lifecycle ----------
  function boot() {
    ensureStyle()
    ensureLayer()
    try { if (!pop) document.getElementById(POP_ID)?.remove() } catch {}
    applyVars()
    try { syncTyping() } catch {}
    try { decorateGlass() } catch {}

    let tries = 0
    const retry = setInterval(() => {
      tries++
      try { ensureLayer(); ensureDock(); syncTyping(); syncModal(); decorateGlass() } catch {}
      if (tries > 30) clearInterval(retry)
    }, 700)

    // coalesce: streaming replies mutate the DOM constantly, so never run the
    // anchor search synchronously inside the observer callback
    let pending = false
    let lastDock = 0
    let lastModal = 0
    const refreshDom = () => {
      try {
        ensureLayer()
        const dock = document.getElementById(DOCK_ID)
        const now = Date.now()
        if (!dock || now - lastDock > 1500) {
          lastDock = now
          ensureDock()
        }
        syncTyping()
        decorateGlass()
        if (now - lastModal > 250) {
          lastModal = now
          syncModal()
        }
      } catch {}
    }
    const observer = new MutationObserver(() => {
      if (pending) return
      pending = true
      setTimeout(() => { pending = false; refreshDom() }, 400)
    })
    try { observer.observe(document.body, { childList: true, subtree: true }) } catch {}

    // fast path: a stacked window must appear and disappear within a frame, so
    // check the topmost element identity synchronously in the observer callback
    // (microtask, before the next paint) and rescan the moment it changes
    let lastSig = ''
    try { lastSig = topsig() } catch {}
    const fastObserver = new MutationObserver(() => {
      // the glass tagging has to be instant: a re-created composer (new chat)
      // would otherwise spend a few frames without the treatment
      try {
        if (!document.querySelector('.GRgSLq_card[data-wall-glass]')) decorateGlass()
      } catch {}
      try { syncTyping() } catch {}
      let sig = ''
      try { sig = topsig() } catch {}
      if (sig === lastSig) return
      lastSig = sig
      try { syncModal(true) } catch {}
    })
    try { fastObserver.observe(document.body, { childList: true, subtree: true }) } catch {}

    const onInput = () => { try { syncTyping() } catch {} }
    try { document.addEventListener('input', onInput, true) } catch {}

    loadCustomImage()
    setTimeout(() => { try { syncModal() } catch (e) {} }, 1200)


    return function dispose() {
      try { clearInterval(retry) } catch {}
      try { observer.disconnect() } catch {}
      try { fastObserver.disconnect() } catch {}
      try { document.removeEventListener('input', onInput, true) } catch {}
      hidePopover()
      try { document.body.classList.remove('wall-modal') } catch {}
      try { clearBlurHosts() } catch {}
      try { document.getElementById(FROST_ID)?.remove() } catch {}
      try { document.getElementById(DOCK_ID)?.remove() } catch {}
      try { document.getElementById(LAYER_ID)?.remove() } catch {}
      try { document.getElementById(STYLE_ID)?.remove() } catch {}
      try { document.documentElement.style.cssText = '' } catch {}
    }
  }

  function apply(ctx) {
    try {
      ctx.effect(boot, 'dsh-chat-wallpaper: background + controls')
    } catch (e) {
      try { boot() } catch (e2) {}
    }
  }

  window.__ModuleLoader__.load({
    id: 'dsh-chat-wallpaper',
    factory: function () {
      const module = { exports: {} }
      module.exports.inject = []
      module.exports.apply = apply
      return module.exports
    },
  })
})()
