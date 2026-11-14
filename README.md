# Giftory

Shared wishlists where friends reserve gifts in secret. Make a list, share one link, and each gift can be picked once. The owner sees that a gift was picked, never what or who.

**Stack:** React 19 + Vite + Tailwind 4 + TanStack Query · Node + Express 5 + PostgreSQL on Neon (plain SQL with `pg`) · JWT auth

## Run it locally

You need Node 20+ and a Postgres database. A free [Neon](https://neon.tech) project works: copy its pooled connection string.

```bash
# 1. API
cd server
cp .env.example .env      # set DATABASE_URL and JWT_SECRET
npm install
npm run dev               # http://localhost:5000, creates the tables on first start
npm test                  # 30 API checks against an in-memory Postgres

# 2. Web app (second terminal)
cd client
npm install
npm run dev               # http://localhost:5173, /api is proxied to :5000
```

## How the secret works

- `items.reserved_by` is stored but **never sent** to any client (`serializeItems` in `server/src/routes/wishlists.js`).
- Friends get `isReserved` and `reservedByMe`. The owner gets only `isReserved`, and the UI hides the name of a picked item behind the frosted wrap.
- Reserving is one atomic `UPDATE … WHERE reserved_by IS NULL`, so two friends can't grab the same gift (the test suite races two requests to prove it).
- Chipping in is one statement that raises the total only if it stays within the price, and records the contribution in the same step.

The schema lives in `server/src/schema.sql` and is applied on every start (`CREATE TABLE IF NOT EXISTS`).

## API

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/api/auth/register` | | Create account → `{ token, user }` |
| POST | `/api/auth/login` | | Log in → `{ token, user }` |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/wishlists/mine` | ✓ | My lists with picked counts |
| POST | `/api/wishlists` | ✓ | Create a list |
| GET | `/api/wishlists/:slug` | optional | Public list view (shape depends on who asks) |
| PATCH / DELETE | `/api/wishlists/:id` | owner | Edit / delete a list |
| POST | `/api/wishlists/:id/items` | owner | Add a wish |
| PATCH / DELETE | `/api/items/:id` | owner | Edit / remove a wish |
| POST / DELETE | `/api/items/:id/reserve` | friend | Reserve / cancel |
| POST | `/api/items/:id/contribute` | friend | Chip in on a group gift `{ amount }` |
| GET | `/api/items/reserved/mine` | ✓ | Gifts I picked or chipped in on |
| POST | `/api/images` | ✓ | Upload a photo (raw JPG/PNG/WebP body) → `{ url }` |
| GET | `/api/images/:id` | | Serve a photo (cached for a year) |

## Telegram login

"Continue with Telegram" uses Telegram's OpenID Connect login (authorization code + PKCE) in `server/src/routes/telegram.js`:

1. `/api/auth/telegram/start` sends the browser to Telegram with a random `state` and PKCE challenge, kept in a short-lived signed cookie.
2. `/api/auth/telegram/callback` checks `state`, trades the code for an `id_token` (using the client secret), and verifies its signature against Telegram's public keys.
3. The user is found or created by Telegram ID, and the session token is handed to the app in the URL fragment, so it never reaches server logs.

Logged-in email users can **Connect Telegram** from the account menu, so both log-ins open the same account.

Setup: in @BotFather → your bot → **Login Widget**, add both Allowed URLs: the site (`https://your-site`) and the callback (`https://your-site/api/auth/telegram/callback`). Then set `TELEGRAM_CLIENT_ID`, `TELEGRAM_CLIENT_SECRET` and `PUBLIC_URL` on the server. Without them the button is hidden. The test suite runs the whole flow against a fake Telegram server.

## Analytics

Anonymous, cookieless visit counts with self-hosted [Umami](https://umami.is) (`analytics/Dockerfile`, a separate Render service using its own `umami` database in Neon).

- The tracker loads from Giftory's own domain: `server/src/routes/analytics.js` proxies `/u/script.js` and `/u/api/send` to Umami, so visitors' browsers never contact a third party.
- It only runs in production builds with `VITE_UMAMI_WEBSITE_ID` set (server needs `UMAMI_URL`). URL fragments are never sent, and browsers with Do Not Track aren't counted.

## Languages and themes

- **English** (default) and **Russian**, switched in the header and saved per device. All text lives in `client/src/i18n.jsx`, with Russian plural forms (1 желание, 2 желания, 5 желаний). Server error messages are translated on the client by their English text.
- **Light** (default) and **dark** themes. Colors are CSS variables in `client/src/index.css`; dark mode swaps them under `.dark`. The saved theme is applied before the page paints, so there is no flash.
- Headings use Archivo; Cyrillic letters fall back to Roboto Flex, which has the same width and weight range.

## Photos

Wishes take a photo from the device gallery (or an image link). The browser shrinks it to at most 1200px WebP before upload, so photos are usually 100–200 KB and stored in Postgres (`images` table). Every photo shows in the same 4:3 frame without cropping: the full photo sits on a blurred copy of itself, so tall and wide photos line up.

## Deploy

- **One service:** run `npm run build` in `client`, then `npm start` in `server`. Express serves `client/dist` when it exists.
- **Split:** client on Vercel with `VITE_API_URL=https://your-api/api`, server on Render with `CLIENT_URL` set to the Vercel URL.
- Set `DATABASE_URL` (Neon pooled string) and `JWT_SECRET` on the server.

## Next up

- "Fill in from link": pull name, price and photo from a store page
- Email or Telegram notice when someone picks a gift
