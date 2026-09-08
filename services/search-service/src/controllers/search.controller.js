import { asyncHandler, success } from '@nova/shared';
import searchService from '../services/search.service.js';

export const search = asyncHandler(async (req, res) => {
  const result = await searchService.search(req.query, req);
  success(res, result.products, 'Search results', result.meta);
});

export const suggestions = asyncHandler(async (req, res) => {
  const list = await searchService.suggestions(req.query.q, req.query.limit || 8, req);
  success(res, list, 'Suggestions retrieved');
});

export const getRecent = asyncHandler(async (req, res) => {
  const list = searchService.getRecent(req);
  success(res, list, 'Recent queries retrieved');
});

export const recordRecent = asyncHandler(async (req, res) => {
  searchService.recordQuery(req.body.q, req);
  success(res, null, 'Query recorded');
});

export default { search, suggestions, getRecent, recordRecent };
