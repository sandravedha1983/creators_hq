const { z } = require('zod');

const statusSchema = z.enum(['pending', 'accepted', 'rejected', 'completed']);

const requestSchema = z.object({
  receiver_id: z.number(),
  message: z.string().optional()
});

module.exports = { statusSchema, requestSchema };
