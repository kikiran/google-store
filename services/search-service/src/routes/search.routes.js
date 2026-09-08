import { Router } from 'express';
import { middleware } from '@nova/shared';
import controller from '../controllers/search.controller.js';
import { searchQuery, suggestionsQuery, recentQuery, recordRecentSchema } from '../schemas/search.schema.js';

const router = Router();
const { validate } = middleware;

router.get('/suggestions', validate(suggestionsQuery), controller.suggestions);
router.get('/recent', validate(recentQuery), controller.getRecent);
router.post('/recent', validate(recordRecentSchema), controller.recordRecent);
router.get('/', validate(searchQuery), controller.search);

export default router;
