import { test, expect } from '@playwright/test';

test.describe('Feed Timeline E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and set up localStorage
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('activeFamilyId', '1');
    });
  });

  test('should display MESSAGE as bubbles', async ({ page }) => {
    // Mock API responses
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
    
    // Check that message is displayed
    await expect(page.getByText('Test message')).toBeVisible();
  });

  test('should display POST as cards', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
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
    });

    await page.goto('http://localhost:5173/feed');
    
    await expect(page.getByText('Test post')).toBeVisible();
    await expect(page.getByText('POST')).toBeVisible();
  });

  test('should display ANNOUNCEMENT as highlighted cards', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              id: 1,
              type: 'ANNOUNCEMENT',
              text: 'Test announcement',
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
    
    await expect(page.getByText('Test announcement')).toBeVisible();
    await expect(page.getByText('ANNOUNCEMENT')).toBeVisible();
  });

  test('should create MESSAGE via composer', async ({ page }) => {
    let postCreated = false;

    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/posts/') && route.request().method() === 'POST') {
        postCreated = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            type: 'MESSAGE',
            text: 'New message',
            author_user: 'testuser',
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: postCreated ? [
              {
                id: 1,
                type: 'MESSAGE',
                text: 'New message',
                author_user: 'testuser',
                created_at: new Date().toISOString(),
              },
            ] : [],
            count: postCreated ? 1 : 0,
          }),
        });
      }
    });

    await page.goto('http://localhost:5173/feed');
    
    const input = page.getByPlaceholderText(/type a message/i);
    await input.fill('New message');
    
    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();
    
    await expect(page.getByText('New message')).toBeVisible();
  });

  test('should create POST via composer', async ({ page }) => {
    let postCreated = false;

    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/posts/') && route.request().method() === 'POST') {
        postCreated = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            type: 'POST',
            text: 'New post',
            author_user: 'testuser',
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: postCreated ? [
              {
                id: 1,
                type: 'POST',
                text: 'New post',
                author_user: 'testuser',
                created_at: new Date().toISOString(),
              },
            ] : [],
            count: postCreated ? 1 : 0,
          }),
        });
      }
    });

    await page.goto('http://localhost:5173/feed');
    
    // Switch to POST
    const postButton = page.getByRole('button', { name: /post/i });
    await postButton.click();
    
    const input = page.getByPlaceholderText(/write a post/i);
    await input.fill('New post');
    
    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();
    
    await expect(page.getByText('New post')).toBeVisible();
  });

  test('should toggle composer type', async ({ page }) => {
    await page.route('**/api/feed/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [],
          count: 0,
        }),
      });
    });

    await page.goto('http://localhost:5173/feed');
    
    // Should start with MESSAGE
    await expect(page.getByPlaceholderText(/type a message/i)).toBeVisible();
    
    // Toggle to POST
    const postButton = page.getByRole('button', { name: /post/i });
    await postButton.click();
    
    await expect(page.getByPlaceholderText(/write a post/i)).toBeVisible();
  });
});
