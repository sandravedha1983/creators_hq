const collaborationModel = require('./models');
const { statusSchema, requestSchema } = require('./validations');

const getByBrand = async (req, res, next) => {
  try {
    const list = await collaborationModel.getByBrand(req.params.brandId);
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

const getByCreator = async (req, res, next) => {
  try {
    const list = await collaborationModel.getByCreator(req.params.creatorId);
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const status = statusSchema.parse(req.body.status);
    const updated = await collaborationModel.updateStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const createRequest = async (req, res, next) => {
  try {
    const validatedData = requestSchema.parse(req.body);
    const request = await collaborationModel.create({
      sender_id: req.user.id,
      receiver_id: validatedData.receiver_id,
      message: validatedData.message
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = { getByBrand, getByCreator, updateStatus, createRequest };
