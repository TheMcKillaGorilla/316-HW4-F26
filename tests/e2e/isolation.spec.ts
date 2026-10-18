/**
 * isolation.spec.ts
 *
 * Two users, and neither can see or touch the other's lists.
 *
 * The server tests already prove each route refuses another user's list. What
 * is checked here is the whole path a real browser takes: the login cookie
 * really changes who the server thinks is asking, and the pages built for one
 * user never show another's lists, even when the address of one is typed in.
 *
 * Every test begins logged in as Joe, and then becomes another user: Jane,
 * the other example account, who has lists of her own, or Bob, a brand new
 * account with none. page.request shares the browser's cookies, so a request
 * sent through it is sent as whoever the browser is logged in as at the time.
 *
 * YOU WRITE THIS FILE. Two tests are written as examples, one through the
 * pages and one straight through the API. Each test.fixme is one you write:
 * change test.fixme to test and give it a body. Keep every name exactly as it
 * is, since your tests are graded by running them against the solution.
 */
import { test, expect, type Page } from '@playwright/test';
import {
    openApp, openList, homeView, listCards, listCardNamed, listNames, itemDescriptions,
    logInThroughApi, logOutThroughApi, registerThroughApi,
    JANE_EMAIL, JANE_PASSWORD, JANE_LIST_NAMES, STARTER_LIST_NAMES, SAMPLE_LIST_NAME, SAMPLE_ITEMS
} from './support/app';

const BOB_EMAIL = 'bob@stonybrook.edu';
const BOB_PASSWORD = 'bobs-password';

/** Joe's sample list's id, as its card on the home screen carries it */
let joesListId: string;

test.beforeEach(async ({ page }) => {
    await openApp(page);
    joesListId = (await listCardNamed(page, SAMPLE_LIST_NAME).getAttribute('data-list-id'))!;
});

/** Logs Joe out and Bob in, as a brand new account. */
async function becomeBob(page: Page) {
    await logOutThroughApi(page);
    await registerThroughApi(page, BOB_EMAIL, BOB_PASSWORD);
}

/** Logs Joe out and Jane in. */
async function becomeJane(page: Page) {
    await logOutThroughApi(page);
    await logInThroughApi(page, JANE_EMAIL, JANE_PASSWORD);
}

/** Logs whoever it is out and Joe back in. */
async function becomeJoeAgain(page: Page) {
    await logOutThroughApi(page);
    await logInThroughApi(page);
}

test.describe('the two example accounts', () => {
    test('each see only their own lists', async ({ page }) => {
        // the beforeEach left Joe on his home screen
        expect(await listNames(page)).toEqual(STARTER_LIST_NAMES);

        await becomeJane(page);
        await page.goto('/lists');

        await expect(listCards(page)).toHaveCount(JANE_LIST_NAMES.length);
        expect(await listNames(page)).toEqual(JANE_LIST_NAMES);
    });

    test.fixme('cannot open each other\'s lists', async ({ page }) => {
    });
});

test.describe('the home screen', () => {
    test.fixme('shows a second user none of the first user\'s lists', async ({ page }) => {
    });

    test.fixme('never shows the first user what the second user made', async ({ page }) => {
    });
});

test.describe('typing in the address of somebody else\'s list', () => {
    test.fixme('sends the user back to their own lists, and says the list could not be opened', async ({ page }) => {
    });

    test.fixme('leaves that list exactly as it was', async ({ page }) => {
    });
});

test.describe('the API, asked as the second user about the first user\'s list', () => {
    // a list that is not yours gets the same 404 as one that does not exist,
    // so nobody can even learn that it is there

    test('will not hand it over', async ({ page }) => {
        await becomeBob(page);

        const response = await page.request.get(`/api/lists/${joesListId}`);

        expect(response.status()).toBe(404);
    });

    test.fixme('will not save over it', async ({ page }) => {
    });

    test.fixme('will not delete it', async ({ page }) => {
    });

    test.fixme('will not copy it', async ({ page }) => {
    });

    test.fixme('changed nothing by being asked', async ({ page }) => {
    });
});
