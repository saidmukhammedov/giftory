CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wishlists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  title      text NOT NULL,
  occasion   text,
  event_date date,
  note       text,
  slug       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wishlists_owner_idx ON wishlists (owner_id);

CREATE TABLE IF NOT EXISTS items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id   uuid NOT NULL REFERENCES wishlists ON DELETE CASCADE,
  name          text NOT NULL,
  link          text,
  price         bigint NOT NULL CHECK (price >= 0),
  image         text,
  note          text,
  priority      text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_group_gift boolean NOT NULL DEFAULT false,
  reserved_by   uuid REFERENCES users ON DELETE SET NULL,
  reserved_at   timestamptz,
  funded        bigint NOT NULL DEFAULT 0 CHECK (funded <= price),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS items_wishlist_idx ON items (wishlist_id);
CREATE INDEX IF NOT EXISTS items_reserved_by_idx ON items (reserved_by);

CREATE TABLE IF NOT EXISTS contributions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid NOT NULL REFERENCES items ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  amount     bigint NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contributions_item_idx ON contributions (item_id);

CREATE TABLE IF NOT EXISTS images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  mime       text NOT NULL,
  data       bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
