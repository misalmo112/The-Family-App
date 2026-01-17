import { test, expect } from '@playwright/test';

test.describe('Comments E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('activeFamilyId', '1');
    });
  });

  test('should expand comments on POST', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/comments/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 1,
                text: 'First comment',
                author_user: 'user2',
                author_person_name: 'User Two',
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
    
    await expect(page.getByText('Test post')).toBeVisible();
    
    const expandButton = page.getByText(/view comment/i);
    await expandButton.click();
    
    await expect(page.getByText('First comment')).toBeVisible();
  });

  test('should create comment on POST', async ({ page }) => {
    let commentCreated = false;

    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/comments/') && method === 'POST') {
        commentCreated = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            text: 'New comment',
            author_user: 'testuser',
            created_at: new Date().toISOString(),
          }),
        });
      } else if (url.includes('/comments/') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: commentCreated ? [
              {
                id: 1,
                text: 'New comment',
                author_user: 'testuser',
                created_at: new Date().toISOString(),
              },
            ] : [],
            count: commentCreated ? 1 : 0,
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
    
    const expandButton = page.getByText(/view comment/i);
    await expandButton.click();
    
    await expect(page.getByPlaceholderText(/write a comment/i)).toBeVisible();
    
    const input = page.getByPlaceholderText(/write a comment/i);
    await input.fill('New comment');
    
    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();
    
    // Comment should appear immediately
    await expect(page.getByText('New comment')).toBeVisible();
  });

  test('should hide comments on MESSAGE', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              id: 1,
              type: 'MESSAGE',
              text: 'Test message',
              author_user: 'user1',
              author_person_id: 123,
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        }),
      });
    });

    await page.goto('http://localhost:5173/feed');
    
    await expect(page.getByText('Test message')).toBeVisible();
    
    // Comments section should NOT be visible for MESSAGE
    await expect(page.getByText(/view comment/i)).not.toBeVisible();
  });
});
