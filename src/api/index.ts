import { isLiveApiConfigured } from './endpoints';
import { liveApi } from './liveApi';
import { mockApi } from './mockApi';

export const odysseyApi = isLiveApiConfigured ? liveApi : mockApi;
export { endpoints, isLiveApiConfigured } from './endpoints';
export type * from './contracts';
