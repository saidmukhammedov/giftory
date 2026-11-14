import { Router } from 'express';
import Item from '../models/Item.js';
import Contribution from '../models/Contribution.js';
import { requireAuth } from '../middleware/auth.js';
import { ownedList, serializeItems } from './wishlists.js';

const router = Router();
const FIELDS = ['name', 'link', 'price', 'image', 'note', 'priority', 'isGroupGift'];
const fail = (status, message) => Object.assign(new Error(message), { status });

const findItem = async (id) => {
  const item = await Item.findById(id).populate('wishlist', 'owner title slug eventDate');
  if (!item) throw fail(404, 'This wish no longer exists');
  return item;
};
const notOwner = (item, userId) => {
  if (String(item.wishlist.owner) === String(userId)) throw fail(403, "You can't pick gifts from your own list");
};

// Gifts the current user reserved or chipped in on, across all lists
router.get('/reserved/mine', requireAuth, async (req, res) => {
  const chipped = await Contribution.distinct('item', { user: req.userId });
  const items = await Item.find({ $or: [{ reservedBy: req.userId }, { _id: { $in: chipped } }] })
    .populate('wishlist', 'title slug eventDate')
    .sort('-updatedAt');
  const data = await serializeItems(items, req.userId);
  res.json(data.map((d, i) => ({ ...d, wishlist: items[i].wishlist })));
});

router.patch('/:id', requireAuth, async (req, res) => {
  const item = await findItem(req.params.id);
  await ownedList(item.wishlist._id, req.userId);
  for (const k of FIELDS) if (req.body[k] !== undefined) item[k] = req.body[k];
  await item.save();
  res.json((await serializeItems([item], null))[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const item = await findItem(req.params.id);
  await ownedList(item.wishlist._id, req.userId);
  await Promise.all([Contribution.deleteMany({ item: item._id }), item.deleteOne()]);
  res.status(204).end();
});

router.post('/:id/reserve', requireAuth, async (req, res) => {
  notOwner(await findItem(req.params.id), req.userId);
  // Atomic: only succeeds if nobody holds it, so two friends can't grab the same gift
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, reservedBy: null, isGroupGift: false },
    { reservedBy: req.userId, reservedAt: new Date() },
    { new: true }
  );
  if (!item) throw fail(409, 'Someone already reserved this gift');
  res.json((await serializeItems([item], req.userId))[0]);
});

router.delete('/:id/reserve', requireAuth, async (req, res) => {
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, reservedBy: req.userId },
    { reservedBy: null, reservedAt: null },
    { new: true }
  );
  if (!item) throw fail(404, "You haven't reserved this gift");
  res.json((await serializeItems([item], req.userId))[0]);
});

router.post('/:id/contribute', requireAuth, async (req, res) => {
  const amount = Math.round(Number(req.body.amount));
  if (!(amount > 0)) throw fail(400, 'Enter an amount above zero');
  notOwner(await findItem(req.params.id), req.userId);
  // Atomic: never lets the total go past the price
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, isGroupGift: true, $expr: { $lte: [{ $add: ['$funded', amount] }, '$price'] } },
    { $inc: { funded: amount } },
    { new: true }
  );
  if (!item) throw fail(409, 'That amount is more than what is left to raise');
  await Contribution.create({ item: item._id, user: req.userId, amount });
  res.json((await serializeItems([item], req.userId))[0]);
});

export default router;
