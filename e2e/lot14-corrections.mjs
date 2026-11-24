/* ---------------------------------------------------------------------------
   Nidz 1.4 corrections — profile folds, one back button, no overlapping
   prices.

   1. The sitter profile's "Comment j'accueille les animaux", "Ce que je ne
      peux pas accepter" and "À propos" are closed by default, open and close
      from their heading, and keep the essentials visible while closed.
   2. The back control is one shape — white, round, an ink arrow — in the same
      place on a browsable screen and on a flow step, and stays in view while
      the page scrolls.
   3. In the profile's "Services et tarifs", a price never collides with its
      service: at 320px it drops under it, in all three languages.
   ------------------------------------------------------------------------ */
import { ACCOUNT, BASE, check, done, open, publishedSitter, seedState } from "./lib.mjs";

const owner = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false }, activeWorkspace: "owner" });

/* 1. Folds ------------------------------------------------------------- */
{
  const { context, page } = await open({ lang: "fr", state: owner });
  await page.goto(`${BASE}/sitters/amina-b`);
  const triggers = page.locator("main button[aria-expanded]");
  const names = await triggers.allInnerTexts();
  check(
    "profile: the three sections are folds, in order",
    names.length === 3 && /Comment j['’]accueille/.test(names[0]),
    names.join(" | "),
  );
  check("…'Ce que je ne peux pas accepter' before 'À propos'", names[1]?.includes("Ce que je ne peux pas accepter") && names[2]?.includes("À propos"));
  const states = await triggers.evaluateAll((els) => els.map((e) => e.getAttribute("aria-expanded")));
  check("…all closed by default", states.every((s) => s === "false"), states.join(","));
  /* Headings stay headings, whatever the state. */
  const headings = await page.locator("main h2").allInnerTexts();
  check("…each fold is still an h2 in the outline", ["accueille", "ne peux pas accepter", "À propos"].every((w) => headings.some((h) => h.includes(w))));

  /* Closed, the essentials are on screen: the first limit whole, the home. */
  const limitsCard = page.locator("main [data-state]").filter({ has: page.getByRole("button", { name: /ne peux pas accepter/ }) }).first();
  check("closed: the first limit is readable in the summary", await limitsCard.getByText("Je ne peux pas accueillir de chat", { exact: false }).isVisible());
  check("closed: the others are counted", await limitsCard.getByText("+ 1 autre limite").isVisible());
  check("closed: the intro sentence is not shown yet", !(await page.getByText("Ces limites sont indiquées par le pet-sitter").isVisible()));
  const careCard = page.locator("main [data-state]").filter({ has: page.getByRole("button", { name: /accueille/ }) }).first();
  check("closed: the home summary names how many at once", /à la fois/.test(await careCard.innerText()));

  /* Open by the heading button, close again. */
  await page.getByRole("button", { name: /ne peux pas accepter/ }).click();
  await page.waitForTimeout(350);
  check("open: aria-expanded is true", (await page.getByRole("button", { name: /ne peux pas accepter/ }).getAttribute("aria-expanded")) === "true");
  check("open: every limit and the intro are shown", (await page.getByText("Je ne garde pas de chien non sociable").isVisible()) && (await page.getByText("Ces limites sont indiquées par le pet-sitter").isVisible()));
  const chevron = await page
    .getByRole("button", { name: /ne peux pas accepter/ })
    .locator("svg")
    .evaluate((el) => getComputedStyle(el).transform);
  check("open: the chevron has turned", chevron !== "none" && chevron.startsWith("matrix(-1"), chevron);
  /* Keyboard: Space on the focused trigger closes it. */
  await page.getByRole("button", { name: /ne peux pas accepter/ }).focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(350);
  check("keyboard: Space closes it again", (await page.getByRole("button", { name: /ne peux pas accepter/ }).getAttribute("aria-expanded")) === "false");
  /* A tap on the summary opens it too. */
  await limitsCard.getByText("Je ne peux pas accueillir de chat", { exact: false }).click();
  await page.waitForTimeout(350);
  check("a tap on the summary opens the section", (await page.getByRole("button", { name: /ne peux pas accepter/ }).getAttribute("aria-expanded")) === "true");
  await context.close();
}

/* Reduced motion: still opens, instantly. */
{
  const { context, page } = await open({ lang: "ar", state: owner, reducedMotion: "reduce" });
  await page.goto(`${BASE}/sitters/amina-b`);
  const trigger = page.locator("main button[aria-expanded]").nth(1);
  await trigger.click();
  await page.waitForTimeout(60);
  check("reduced motion (ar): the fold opens at once", (await trigger.getAttribute("aria-expanded")) === "true");
  await context.close();
}

/* 2. Back ---------------------------------------------------------------- */
{
  const { context, page } = await open({ lang: "fr", state: owner, viewport: { width: 360, height: 740 } });
  await page.goto(`${BASE}/sitters/amina-b`);
  const back = page.getByRole("button", { name: "Retour" });
  check("profile: exactly one Back control", (await back.count()) === 1);
  check("…inside the sticky top bar", await back.evaluate((el) => Boolean(el.closest("header")) && getComputedStyle(el.closest("header")).position === "sticky"));
  const look = await back.evaluate((el) => {
    const s = getComputedStyle(el);
    const svg = getComputedStyle(el.querySelector("svg"));
    return { bg: s.backgroundColor, radius: s.borderRadius, w: el.offsetWidth, h: el.offsetHeight, ink: svg.color };
  });
  check("…white, round, 44px", look.bg === "rgb(255, 255, 255)" && look.w === 44 && look.h === 44 && parseFloat(look.radius) >= 22, JSON.stringify(look));
  const [r, g, b] = look.ink.match(/\d+/g).map(Number);
  check("…with an ink (near-black) arrow", r < 40 && g < 45 && b < 45, look.ink);
  const before = await back.boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(150);
  const after = await back.boundingBox();
  check("…still in view, same place, after scrolling to the end", after && after.y === before.y && after.x === before.x, `${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  /* Nothing of the page is drawn under the button: the bar is opaque. */
  const barBg = await back.evaluate((el) => getComputedStyle(el.closest("header")).backgroundColor);
  check("…on an opaque bar", !barBg.includes("rgba") || barBg.endsWith(", 1)"), barBg);

  /* Same place on a flow step. */
  await page.goto(`${BASE}/owner/need/location`);
  const flowBack = await page.getByRole("button", { name: "Retour" }).boundingBox();
  check("flow step: Back in the same place and size as on the profile", flowBack && flowBack.x === before.x && flowBack.y === before.y && flowBack.width === before.width, `${JSON.stringify(flowBack)} vs ${JSON.stringify(before)}`);

  /* And on a browsable page with little content. */
  await page.goto(`${BASE}/help`);
  const helpBack = await page.getByRole("button", { name: "Retour" }).boundingBox();
  check("Help: Back in the same place", helpBack && helpBack.x === before.x && helpBack.y === before.y);
  await context.close();
}
{
  const { context, page } = await open({ lang: "ar", state: owner, viewport: { width: 360, height: 740 } });
  await page.goto(`${BASE}/sitters/amina-b`);
  const box = await page.locator("header button").first().boundingBox();
  check("Arabic: Back at the inline start (top right)", box && box.x + box.width > 300, JSON.stringify(box));
  await context.close();
}

/* 3. Prices ---------------------------------------------------------------- */
const sitter = publishedSitter({ services: ["boarding", "atOwner", "walk"], rates: { boarding: 12500, atOwner: 11200, walk: 600 } });
const sitterState = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, activeWorkspace: "sitter", sitter });
for (const lang of ["fr", "en", "ar"]) {
  const { context, page } = await open({ lang, state: sitterState, viewport: { width: 320, height: 740 } });
  await page.goto(`${BASE}/sitter/preview`);
  const collisions = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("header.surface dd p")];
    const textRect = (el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return r.getBoundingClientRect();
    };
    let bad = 0;
    for (const row of rows) {
      const parts = row.querySelectorAll(":scope > span > span:not(.sr-only)");
      if (parts.length < 2) continue;
      const a = textRect(parts[0]);
      const b = textRect(parts[1]);
      const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
      if (overlap) bad += 1;
    }
    return { rows: rows.length, bad };
  });
  check(`preview ${lang} @320: ${collisions.rows} services, no price over its service`, collisions.rows === 3 && collisions.bad === 0, JSON.stringify(collisions));
  check(`preview ${lang} @320: no sideways scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await context.close();
}

await done();
