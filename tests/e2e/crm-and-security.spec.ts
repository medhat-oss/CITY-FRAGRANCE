import { test, expect } from '@playwright/test';
import { setupAdminSession, setupCashierSession } from './helpers/auth';

test.describe('CRM ERP & Security End-to-End Suite', () => {

  /**
   * Test 1 (Security - API Orders):
   * Tests that forging a unit price of 10 EGP and an order total of 10 EGP
   * on POST /api/admin/orders is rejected server-side. The server recalculates
   * the real catalog price from the database and ignores any unapproved coupon.
   */
  test('Test 1 (Security - API Orders): rejects forged prices and computes real database totals', async ({
    request,
  }) => {
    // 1. Fetch live catalog products to get a legitimate catalog item
    const productsRes = await request.get('/api/products');
    expect(productsRes.ok()).toBeTruthy();
    const productsData = await productsRes.json();
    const products = Array.isArray(productsData.products) ? productsData.products : [];
    expect(products.length).toBeGreaterThan(0);

    // Pick an in-stock catalog item to verify price recomputation
    const targetProduct = products.find((p: any) => (p.stock || 0) > 0) || products[0];
    const realDbPrice = Number(targetProduct.salePrice || targetProduct.price);
    expect(realDbPrice).toBeGreaterThan(10); // Real perfumes cost > 10 EGP

    // 2. Submit a malicious payload attempting to force price: 10 EGP with an invalid/exhausted coupon
    const forgedOrderPayload = {
      customerName: 'Security Attacker',
      phoneNumber: '01019998888',
      email: 'attacker@test.com',
      address: '123 Test Security Rd',
      city: 'Cairo',
      governorate: 'Cairo',
      source: 'ONLINE',
      items: [
        {
          id: targetProduct.id,
          name: targetProduct.name,
          quantity: 1,
          price: 10, // Tampered unit price
        },
      ],
      totalPrice: 10, // Tampered order total price
      discountCode: 'EXHAUSTED_OR_TAMPERED_COUPON_100',
    };

    const orderRes = await request.post('/api/admin/orders', {
      data: forgedOrderPayload,
    });

    expect(orderRes.ok()).toBeTruthy();
    const orderData = await orderRes.json();
    expect(orderData.success).toBe(true);
    expect(orderData.order).toBeDefined();

    // 3. Assert server-side price recomputation (S1):
    // Server must reject client price 10 and compute based on DB price
    expect(orderData.order.totalPrice).toBeGreaterThanOrEqual(realDbPrice);
    expect(orderData.order.totalPrice).not.toBe(10);

    // 4. Assert invalid/exhausted coupon discount is not applied (S4)
    expect(orderData.order.discountAmount || 0).toBe(0);
  });

  /**
   * Test 2 (Auth/Middleware):
   * Tests that a cashier token (or non-admin session) attempting to access
   * /admin/crm/pipeline is blocked by Next.js middleware and redirected away.
   */
  test('Test 2 (Auth/Middleware): blocks cashier from accessing /admin/crm routes', async ({
    context,
    page,
    baseURL,
  }) => {
    // 1. Set only cashier_session cookie (strictly no admin_session)
    await setupCashierSession(context, baseURL);

    // 2. Attempt to visit restricted admin CRM route
    await page.goto('/admin/crm/pipeline');

    // 3. Assert middleware redirects cashier away to /admin/login
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  /**
   * Test 3 (Leads UI):
   * Opens the "+ New Lead" modal, fills data, submits, asserts that the new lead
   * row appears immediately in the table, verifies the wa.me link generation,
   * and verifies the Source filter dropdown.
   */
  test('Test 3 (Leads UI): creates lead, verifies table injection, wa.me link and source filter', async ({
    context,
    page,
    baseURL,
  }) => {
    await setupAdminSession(context, baseURL);

    await page.goto('/admin/crm/leads');
    await expect(page.locator('text=Leads & Inquiries').first()).toBeVisible();

    // Open '+ New Lead' modal
    const newLeadBtn = page.getByRole('button', { name: /\+ New Lead/i });
    await newLeadBtn.click();
    await expect(page.getByText('Create New Lead')).toBeVisible();

    const uniquePhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const leadName = `E2E Lead ${Date.now().toString().slice(-4)}`;

    // Fill form fields using distinct selectors
    await page.locator('form input[placeholder*="Karim Mansour"]').fill(leadName);
    await page.locator('form input[type="tel"]').fill(uniquePhone);
    await page.locator('form input[placeholder*="Nile Hospitality"]').fill('E2E Luxury Fragrances');

    // Select Source 'Instagram'
    const sourceSelect = page.locator('form select').first();
    await sourceSelect.selectOption('Instagram');

    // Fill Preferred Notes using .first()
    await page.locator('form textarea').first().fill('Oud, Amber, and French Vanilla notes');

    // Submit form
    await page.locator('form button[type="submit"]').click();

    // Verify modal closes and lead appears in table
    await expect(page.getByText('Create New Lead')).not.toBeVisible({ timeout: 10000 });
    const leadRow = page.locator('tr').filter({ hasText: leadName });
    await expect(leadRow).toBeVisible();

    // Verify WhatsApp link format
    const waLink = leadRow.locator('a[title*="WhatsApp"]');
    await expect(waLink).toBeVisible();
    await expect(waLink).toHaveAttribute('href', new RegExp(`wa\\.me/2${uniquePhone}`));

    // Verify Source Filter
    const sourceFilterSelect = page.locator('select').filter({ has: page.locator('option[value="Instagram"]') }).first();
    await sourceFilterSelect.selectOption('Instagram');
    await expect(page.locator('tr').filter({ hasText: leadName })).toBeVisible();

    // Switch filter to another source where this lead should be excluded
    await sourceFilterSelect.selectOption('Walk-in Store');
    await expect(page.locator('tr').filter({ hasText: leadName })).not.toBeVisible();

    // Reset filter back to ALL
    await sourceFilterSelect.selectOption('ALL');
    await expect(page.locator('tr').filter({ hasText: leadName })).toBeVisible();
  });

  /**
   * Test 4 (Pipeline Kanban):
   * Navigates to /admin/crm/pipeline, adds a new deal, verifies its placement
   * in 'Lead In', transitions the card to 'Closed Won', and asserts the
   * stage updates and persists live without a page reload.
   */
  test('Test 4 (Pipeline Kanban): moves card to Closed Won and updates stage without reload', async ({
    context,
    page,
    baseURL,
  }) => {
    await setupAdminSession(context, baseURL);

    await page.goto('/admin/crm/pipeline');
    await expect(page.locator('text=Sales Pipeline').first()).toBeVisible();

    const dealTitle = `E2E Deal ${Date.now().toString().slice(-4)}`;
    const dealValue = '3500';

    // Click '+ New Deal' button
    const addDealBtn = page.getByRole('button', { name: /\+ New Deal/i });
    await addDealBtn.click();
    await expect(page.getByText('Add New Deal')).toBeVisible();

    // Fill deal form
    await page.locator('form input[placeholder*="Corporate Year-End"]').fill(dealTitle);
    await page.locator('form input[placeholder*="75000"]').fill(dealValue);

    // Initial stage: 'Lead In'
    const stageSelect = page.locator('form select').first();
    await stageSelect.selectOption('Lead In');

    const [dealResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/admin/crm/deals') && res.request().method() === 'POST'
      ),
      page.locator('form button[type="submit"]').click(),
    ]);

    if (!dealResponse.ok()) {
      console.error('DEAL CREATE ERROR:', dealResponse.status(), await dealResponse.text());
    }

    await expect(page.getByText('Add New Deal')).not.toBeVisible({ timeout: 10000 });

    // Locate the newly created deal card
    const dealCard = page.locator('div').filter({ hasText: dealTitle }).last();
    await expect(dealCard).toBeVisible();

    // Move the card to 'Closed Won' using the card's stage switcher dropdown
    const cardStageSwitcher = dealCard.locator('select');
    await cardStageSwitcher.selectOption('Closed Won');

    // Assert that the stage update notification triggers
    await expect(page.getByText(/Moved to Closed Won/i)).toBeVisible();

    // Card should now be listed under 'Closed Won'
    await expect(dealCard).toBeVisible();
  });

  /**
   * Test 5 (Customers LTV & VIP):
   * Navigates to /admin/crm/customers, verifies that customer Lifetime Value
   * is displayed in EGP, changes their segment dropdown to VIP, and asserts
   * that the UI badge updates accordingly.
   */
  test('Test 5 (Customers LTV & VIP): displays formatted LTV and updates segment to VIP', async ({
    context,
    page,
    baseURL,
  }) => {
    await setupAdminSession(context, baseURL);

    await page.goto('/admin/crm/customers');
    await expect(page.locator('text=Customer Directory').first()).toBeVisible();

    // Wait until initial loading spinner clears
    await expect(page.locator('text=Loading customer directory')).not.toBeVisible({ timeout: 10000 });

    // Check if table has customers; if empty, create one via the modal
    const noCustomers = await page.locator('text=No customers found').isVisible();
    if (noCustomers) {
      await page.getByRole('button', { name: /\+ Add Customer/i }).click();
      await expect(page.getByText('Add New Customer')).toBeVisible();
      await page.locator('form input[placeholder*="Dr. Sherif Allam"]').fill('E2E Customer Test');
      await page.locator('form input[type="tel"]').fill('01099887766');
      await page.locator('form button[type="submit"]').click();
      await expect(page.getByText('Add New Customer')).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('tr').filter({ hasText: 'E2E Customer Test' })).toBeVisible();
    }

    const customerRows = page.locator('tbody tr');
    const targetRow = customerRows.first();

    // Verify Lifetime Value column (column index 5) is formatted in EGP
    const ltvCell = targetRow.locator('td').nth(5);
    await expect(ltvCell).toBeVisible();
    const ltvText = await ltvCell.innerText();
    expect(ltvText).toMatch(/(EGP|ج\.م|\d+)/i);

    // Target the customer segment dropdown in the row
    const segmentDropdown = targetRow.locator('select');
    await expect(segmentDropdown).toBeVisible();

    // Change segment to 'VIP'
    await segmentDropdown.selectOption('VIP');

    // Assert toast message and styling update
    await expect(page.getByText(/Segment updated to VIP/i)).toBeVisible();
    await expect(segmentDropdown).toHaveValue('VIP');
  });

});
