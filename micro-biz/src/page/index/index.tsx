// @ts-ignore
import bootstrap from './bootstrap';
import { setUpSentry } from '@/utils/sentry';
setUpSentry();
bootstrap(() => {});