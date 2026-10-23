import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { selectLocale, translate } from '../src/i18n'
import { expect, test } from '@playwright/test'

const locale = selectLocale(process.env.LOCALE)
const t = (key: string) => translate(locale, key)

function collectErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

// Transient text (VS screen, speech bubbles) can come and go while swiftshader stalls the page, so record insertions.
async function watchText(page: import('@playwright/test').Page, pattern: RegExp) {
  await page.addInitScript(source => {
    const wanted = new RegExp(source)
    new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes].some(node => wanted.test(node.textContent ?? '')))) Object.assign(window, { __watched: true })
    }).observe(document, { subtree: true, childList: true })
  }, pattern.source)
  return (timeout: number) => expect.poll(() => page.evaluate(() => '__watched' in window), { timeout }).toBe(true)
}

test('the demo replay renders and pr duel opens and closes', async ({ page }) => {
  const errors = collectErrors(page)
  const sawVs = await watchText(page, /VS/)
  await page.goto('/?replay=demo&speed=20&intro=0&hora=10:00&fx=low')
  await expect(page.locator('canvas').first()).toBeVisible()
  await expect(page.getByTestId('hud-total')).toHaveText(/\d+/)

  await page.getByTestId('brawl-button').first().click()
  await expect(page.getByTestId('duel-overlay')).toBeVisible()
  await sawVs(20_000)
  await expect(page.getByTestId('duel-hud')).toBeVisible({ timeout: 60_000 })

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('duel-overlay')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('the forced inspection lands by helicopter and shows up', async ({ page }) => {
  test.setTimeout(150_000)
  const errors = collectErrors(page)
  const sawLine = await watchText(page, locale === 'pt-BR' ? /essas \d+ aqui são minhas\?/ : /are these \d+ mine\?/)
  await page.goto('/?replay=demo&speed=20&fiscalizacao=1&intro=0&hora=10:00&fx=low')
  await sawLine(120_000)
  await expect(page.getByTestId('ticker')).toContainText(t('inspection.notice'))
  expect(errors).toEqual([])
})

test('the intro plays on first load and can be skipped', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/?replay=demo&speed=20&hora=10:00&fx=low')
  const skip = page.getByRole('button', { name: t('ui.skipIntro') })
  await expect(skip).toBeVisible({ timeout: 30_000 })
  await page.keyboard.press('Space')
  await expect(skip).toHaveCount(0)
  await expect(page.getByTestId('hud-total')).toHaveText(/\d+/)
  expect(errors).toEqual([])
})

test('the konami code starts the dance and esc ends it', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/?replay=demo&speed=20&intro=0&hora=10:00&fx=low')
  await expect(page.getByTestId('hud-total')).toHaveText(/\d+/)
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await page.keyboard.press(key)
  await expect(page.getByText(t('ui.danceMode'))).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText(t('ui.danceMode'))).toHaveCount(0)
  expect(errors).toEqual([])
})


test('demo home works without credentials and refuses live endpoints', async ({ page, request }) => {
  const feeds: string[] = []
  page.on('request', req => { if (req.url().includes('/api/')) feeds.push(new URL(req.url()).pathname) })
  await page.goto('/?replay=private&intro=0&fx=low')
  await expect(page.getByTestId('hud-total')).toHaveText(/\d+/)
  expect(feeds).toContain('/api/replay/demo')
  expect(feeds).not.toContain('/api/replay/private')
  expect(feeds).not.toContain('/api/state')
  for (const path of ['/api/state', '/api/pr/repo/1', '/api/replay/private']) {
    expect((await request.get(path)).status()).toBe(401)
  }
  expect((await request.get('/api/replay/demo')).status()).toBe(200)
})


test('capture localized product screenshots', async ({ page }) => {
  const directory = path.join(process.cwd(), 'public', 'screenshots')
  await mkdir(directory, { recursive: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/?intro=0&hora=10:00&fx=low&shot=1')
  await expect(page.getByTestId('hud-total')).toHaveText(/\d+/)
  await expect(page.locator('canvas').first()).toBeVisible()
  await expect.poll(() => page.locator('canvas').first().evaluate(canvas => {
    const sample = document.createElement('canvas')
    sample.width = sample.height = 64
    const context = sample.getContext('2d')!
    context.drawImage(canvas as HTMLCanvasElement, 0, 0, 64, 64)
    const pixels = context.getImageData(0, 0, 64, 64).data
    const colors = new Set<string>()
    for (let i = 0; i < pixels.length; i += 4) colors.add(`${pixels[i] >> 4},${pixels[i + 1] >> 4},${pixels[i + 2] >> 4}`)
    return colors.size
  }), { timeout: 60_000 }).toBeGreaterThan(30)
  await page.screenshot({ path: path.join(directory, `${locale}-scene.png`), fullPage: true })
  for (const [route, heading, name] of [
    ['/entrar', t('ui.takeATicketLabel'), 'sign-in'],
    ['/fechado', t('ui.bureauClosedToThePublic'), 'closed'],
  ]) {
    await page.goto(route)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    if (route === '/fechado') {
      await expect(page.locator('canvas')).toBeVisible()
      await page.waitForLoadState('networkidle')
    }
    await page.screenshot({ path: path.join(directory, `${locale}-${name}.png`), fullPage: true })
  }
})
