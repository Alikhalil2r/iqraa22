import { test, expect } from '@playwright/test'

test('public home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/.+/)
})

test('login page renders', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('input').first()).toBeVisible()
})

test('parent login page renders', async ({ page }) => {
  await page.goto('/parent/login')
  await expect(page.locator('input').first()).toBeVisible()
})

test('health API via proxy', async ({ request }) => {
  const res = await request.get('/api/health')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.status).toBe('ok')
})
