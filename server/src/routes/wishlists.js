import { Router } from 'express';
import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Item from '../models/Item.js';
import Contribution from '../models/Contribution.js';
import User from '../models/User.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
const LIST_FIELDS = ['title', 'occasion', 'eventDate', 'note'];
const ITEM_FIELDS = ['name', 'link', 'price', 'image', 'note', 'priority', 'isGroupGift'];

// The secret: nobody ever receives reservedBy or contributor ids.
// Owners learn only that an item is taken; friends also learn whether it was them.
export async function serializeItems(items, userId) {
  const groupIds = items.filter((i) => i.isGroupGift).map((i) => i._id);
  const me = userId ? new mongoose.Types.ObjectId(String(userId)) : null;
  const stats = await Contribution.aggregate([
    { $match: { item: { $in: groupIds } } },
    { $group: { _id: '$item', users: { $addToSet: '$user' }, mine: { $sum: { $cond: [{ $eq: ['$user', me] }, '$amount', 0] } } } },
  ]);
  const byItem = Object.fromEntries(stats.map((s) => [String(s._id), s]));

  return items.map((i) => ({
    id: i._id,
    name: i.name,
    link: i.link,
    price: i.price,
    image: i.image,
    note: i.note,
    priority: i.priority,
    isGroupGift: i.isGroupGift,
    isReserved: !!i.reservedBy,
    reservedByMe: !!userId && String(i.reservedBy) === String(userId),
    funded: i.funded,
    contributors: byItem[String(i._id)]?.users.length || 0,
    myContribution: byItem[String(i._id)]?.mine || 0,
  }));
}

export async function ownedList(id, userId) {
  const list = await Wishlist.findById(id);
  if (!list) throw Object.assign(new Error('Wishlist not found'), { status: 404 });
  if (String(list.owner) !== String(userId)) throw Object.assign(new Error('Only the owner can do this'), { status: 403 });
  return list;
}

router.get('/mine', requireAuth, async (req, res) => {
  const lists = await Wishlist.find({ owner: req.userId }).sort('-createdAt').lean();
  const counts = await Item.aggregate([
    { $match: { wishlist: { $in: lists.map((l) => l._id) } } },
    { $group: { _id: '$wishlist', total: { $sum: 1 }, reserved: { $sum: { $cond: [{ $ne: ['$reservedBy', null] }, 1, 0] } } } },
  ]);
  const byList = Object.fromEntries(counts.map((c) => [String(c._id), c]));
  res.json(lists.map((l) => ({ ...l, id: l._id, total: byList[l._id]?.total || 0, reserved: byList[l._id]?.reserved || 0 })));
});

router.post('/', requireAuth, async (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ message: 'Give your wishlist a name' });
  const list = await Wishlist.create({ ...pick(req.body, LIST_FIELDS), owner: req.userId });
  res.status(201).json(list);
});

router.get('/:slug', optionalAuth, async (req, res) => {
  const list = await Wishlist.findOne({ slug: req.params.slug }).lean();
  if (!list) return res.status(404).json({ message: 'This wishlist does not exist or was deleted' });
  const [owner, items] = await Promise.all([User.findById(list.owner), Item.find({ wishlist: list._id }).sort('createdAt')]);
  const isOwner = String(list.owner) === String(req.userId);
  res.json({
    wishlist: { ...list, id: list._id, owner: { name: owner?.name } },
    isOwner,
    items: await serializeItems(items, isOwner ? null : req.userId),
  });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const list = await ownedList(req.params.id, req.userId);
  Object.assign(list, pick(req.body, LIST_FIELDS));
  res.json(await list.save());
});

router.delete('/:id', requireAuth, async (req, res) => {
  const list = await ownedList(req.params.id, req.userId);
  const itemIds = (await Item.find({ wishlist: list._id }, '_id')).map((i) => i._id);
  await Promise.all([Contribution.deleteMany({ item: { $in: itemIds } }), Item.deleteMany({ wishlist: list._id }), list.deleteOne()]);
  res.status(204).end();
});

router.post('/:id/items', requireAuth, async (req, res) => {
  const list = await ownedList(req.params.id, req.userId);
  const { name, price } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Give the wish a name' });
  if (!(Number(price) >= 0)) return res.status(400).json({ message: 'Enter a price in soʻm' });
  const item = await Item.create({ ...pick(req.body, ITEM_FIELDS), wishlist: list._id });
  res.status(201).json((await serializeItems([item], null))[0]);
});

export default router;
