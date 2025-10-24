const Property = require('../models/Property');
const Sale = require('../models/Sale');
const Unit = require('../models/Unit');

async function recomputeAll(req, res, next) {
  try {
    const properties = await Property.find();
    for (const prop of properties) {
      const units = await Unit.find({ propertyId: prop._id });
      const sales = await Sale.find({ propertyId: prop._id, softDeleted: false });

      const totalUnits = units.length;
      const availableUnits = units.filter(u => u.status === 'available').length;
      const reservedUnits = units.filter(u => u.status === 'reserved').length;
      const soldUnits = units.filter(u => u.status === 'sold').length;
      const totalRevenue = sales.reduce((sum, s) => sum + s.salePrice, 0);
      const avgSalePrice = sales.length ? totalRevenue / sales.length : 0;
      const lastSaleDate = sales.length ? sales.reduce((d, s) => (d > s.saleDate ? d : s.saleDate), sales[0].saleDate) : null;

      await Property.updateOne({ _id: prop._id }, {
        totalUnits,
        availableUnits,
        reservedUnits,
        soldUnits,
        totalRevenue,
        avgSalePrice,
        lastSaleDate
      });
    }
    res.json({ message: 'Recompute complete' });
  } catch (e) { next(e); }
}

module.exports = { recomputeAll };