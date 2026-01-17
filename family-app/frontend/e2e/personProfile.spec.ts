import { test, expect } from '@playwright/test';

test.describe('PersonProfile E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('activeFamilyId', '1');
    });
  });

  test('should navigate to profile from Feed link', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      if (url.includes('author_person_id=123')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 1,
                type: 'POST',
                text: 'Profile post',
                author_user: 'user1',
                author_person_id: 123,
                created_at: new Date().toISOString(),
              },
            ],
            count: 1,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 1,
                type: 'POST',
                text: 'Test post',
                author_user: 'user1',
                author_person_id: 123,
                created_at: new Date().toISOString(),
              },
            ],
            count: 1,
          }),
        });
      }
    });

    await page.goto('http://localhost:5173/feed');
    
    // Click on author name link
    const authorLink = page.getByRole('link', { name: /user1/i }).first();
    await authorLink.click();
    
    // Should navigate to profile page
    await expect(page).toHaveURL(/.*\/people\/123/);
    await expect(page.getByText('Profile post')).toBeVisible();
  });

  test('should show toggle when viewing own profile', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      const scope = new URL(url).searchParams.get('scope');
      
      if (scope === 'all_families') {
        // Author check succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [],
            count: 0,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 1,
                type: 'POST',
                text: 'My post',
                author_user: 'testuser',
                author_person_id: 123,
                created_at: new Date().toISOString(),
              },
            ],
            count: 1,
          }),
        });
      }
    });

    await page.goto('http://localhost:5173/people/123');
    
    await expect(page.getByText(/all families/i)).toBeVisible();
  });

  test('should toggle All Families and show posts from all families', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      const scope = new URL(url).searchParams.get('scope');
      
      if (scope === 'all_families' && new URL(url).searchParams.get('author_person_id') === '123' && !new URL(url).searchParams.get('type')) {
        // Author check
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [],
            count: 0,
          }),
        });
      } else if (scope === 'all_families') {
        // All families view
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 1,
                type: 'POST',
                text: 'Post in family 1',
                author_user: 'testuser',
                author_person_id: 123,
                family_name: 'Family 1',
                created_at: new Date().toISOString(),
              },
              {
                id: 2,
                type: 'POST',
                text: 'Post in family 2',
                author_user: 'testuser',
                author_person_id: 123,
                family_name: 'Family 2',
                created_at: new Date().toISOString(),
              },
            ],
            count: 2,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 1,
                type: 'POST',
                text: 'Post in family 1',
                author_user: 'testuser',
                author_person_id: 123,
                created_at: new Date().toISOString(),
              },
            ],
            count: 1,
          }),
        });
      }
    });

    await page.goto('http://localhost:5173/people/123');
    
    await expect(page.getByText(/all families/i)).toBeVisible();
    
    const toggle = page.getByRole('checkbox');
    await toggle.click();
    
    await expect(page.getByText('Family 1')).toBeVisible();
    await expect(page.getByText('Family 2')).toBeVisible();
  });

  test('should not show toggle when viewing other person profile', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      const scope = new URL(url).searchParams.get('scope');
      
      if (scope === 'all_families') {
        // Author check fails
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Not authorized',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 1,
                type: 'POST',
                text: 'Other person post',
                author_user: 'otheruser',
                author_person_id: 456,
                created_at: new Date().toISOString(),
              },
            ],
            count: 1,
          }),
        });
      }
    });

    await page.goto('http://localhost:5173/people/456');
    
    await expect(page.getByText(/all families/i)).not.toBeVisible();
  });

  test('should show 403 error for non-member access', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      const scope = new URL(url).searchParams.get('scope');
      
      if (scope === 'all_families') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Not authorized',
          }),
        });
      } else {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'You are not a member of this family',
          }),
        });
      }
    });

    await page.goto('http://localhost:5173/people/999');
    
    await expect(page.getByText(/not a member of this family/i)).toBeVisible();
  });
});
