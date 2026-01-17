import { test, expect } from '@playwright/test';

test.describe('Complete User Flow E2E', () => {
  test('should complete full flow: login → feed → create message → create post → view profile → add comment', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/token/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access: 'mock-token',
          refresh: 'mock-refresh-token',
        }),
      });
    });

    // Mock families endpoint
    await page.route('**/api/families/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Test Family',
            code: 'TFAM',
            created_at: new Date().toISOString(),
          },
        ]),
      });
    });

    let messageCreated = false;
    let postCreated = false;
    let commentCreated = false;

    // Mock feed endpoint
    await page.route('**/api/feed/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/posts/') && method === 'POST') {
        const body = await route.request().postDataJSON();
        if (body.type === 'MESSAGE') {
          messageCreated = true;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              type: 'MESSAGE',
              text: body.text,
              author_user: 'testuser',
              created_at: new Date().toISOString(),
            }),
          });
        } else {
          postCreated = true;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 2,
              type: 'POST',
              text: body.text,
              author_user: 'testuser',
              author_person_id: 123,
              created_at: new Date().toISOString(),
            }),
          });
        }
      } else if (url.includes('/comments/') && method === 'POST') {
        commentCreated = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            text: 'Test comment',
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
                text: 'Test comment',
                author_user: 'testuser',
                created_at: new Date().toISOString(),
              },
            ] : [],
            count: commentCreated ? 1 : 0,
          }),
        });
      } else if (url.includes('author_person_id=123')) {
        // Profile view
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: 2,
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
      } else {
        // Feed view
        const posts = [];
        if (messageCreated) {
          posts.push({
            id: 1,
            type: 'MESSAGE',
            text: 'Test message',
            author_user: 'testuser',
            author_person_id: 123,
            created_at: new Date().toISOString(),
          });
        }
        if (postCreated) {
          posts.push({
            id: 2,
            type: 'POST',
            text: 'My post',
            author_user: 'testuser',
            author_person_id: 123,
            created_at: new Date().toISOString(),
          });
        }
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: posts,
            count: posts.length,
          }),
        });
      }
    });

    // Step 1: Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button:has-text("Login")');

    // Step 2: Select family
    await expect(page.getByText('Test Family')).toBeVisible();
    await page.click('text=Test Family');

    // Step 3: View feed
    await expect(page).toHaveURL(/.*\/feed/);

    // Step 4: Create message
    const messageInput = page.getByPlaceholderText(/type a message/i);
    await messageInput.fill('Test message');
    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();
    await expect(page.getByText('Test message')).toBeVisible();

    // Step 5: Create post
    const postButton = page.getByRole('button', { name: /post/i });
    await postButton.click();
    const postInput = page.getByPlaceholderText(/write a post/i);
    await postInput.fill('My post');
    await sendButton.click();
    await expect(page.getByText('My post')).toBeVisible();

    // Step 6: View profile
    const authorLink = page.getByRole('link', { name: /testuser/i }).first();
    await authorLink.click();
    await expect(page).toHaveURL(/.*\/people\/123/);
    await expect(page.getByText('My post')).toBeVisible();

    // Step 7: Add comment
    const expandComments = page.getByText(/view comment/i);
    await expandComments.click();
    const commentInput = page.getByPlaceholderText(/write a comment/i);
    await commentInput.fill('Test comment');
    await sendButton.click();
    await expect(page.getByText('Test comment')).toBeVisible();
  });
});
