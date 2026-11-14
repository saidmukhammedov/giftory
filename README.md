# Giftory

Shared wishlists where friends reserve gifts in secret. Make a list, share one link, and each gift can be picked once. The owner sees that a gift was picked, never what or who.

**Stack:** React 19 + Vite + Tailwind 4 + TanStack Query · Node + Express 5 + MongoDB (Mongoose) · JWT auth

## Run it locally

You need Node 20+ and MongoDB (local, or a free MongoDB Atlas cluster).

```bash
# 1. API
cd server
cp .env.example .env      # set MONGO_URI and JWT_SECRET
npm install
npm run dev               # http://localhost:5000

# 2. Web app (second terminal)
cd client
npm install
npm run dev               # http://localhost:5173, /api is proxied to :5000
```

## How the secret works

- `Item.reservedBy` is stored but **never sent** to any client (`serializeItems` in `server/src/routes/wishlists.js`).
- Friends get `isReserved` and `reservedByMe`. The owner gets only `isReserved`, and the UI hides the name of a picked item behind the frosted wrap.
- Reserving is one atomic query (`{ reservedBy: null }` → set), so two friends can't grab the same gift.
- Group gifts use an atomic `$inc` that refuses to go past the price.

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

## Deploy

- **One service:** run `npm run build` in `client`, then `npm start` in `server`. Express serves `client/dist` when it exists.
- **Split:** client on Vercel with `VITE_API_URL=https://your-api/api`, server on Render with `CLIENT_URL` set to the Vercel URL.

## Next up

- Photo uploads (Cloudinary) instead of pasting an image link
- "Fill in from link": pull name, price and photo from a store page
- Email or Telegram notice when someone picks a gift
