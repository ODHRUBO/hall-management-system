const { Hall } = require('../models');

const getManagedHallIds = async (user) => {
  if (user.role === 'admin') return null;
  const halls = await Hall.findAll({
    where: { managerId: user.id, isActive: true },
    attributes: ['id'],
  });
  return halls.map((hall) => hall.id);
};

const canManageHall = async (user, hallId) => {
  if (user.role === 'admin') return true;
  if (!hallId) return false;
  const hall = await Hall.findOne({
    where: { id: hallId, managerId: user.id, isActive: true },
    attributes: ['id'],
  });
  return Boolean(hall);
};

module.exports = { getManagedHallIds, canManageHall };
