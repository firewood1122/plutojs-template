// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import bootstrap from './bootstrap';
import { setUpSentry } from '@/utils/sentry';
setUpSentry();
bootstrap(() => {
	// do nothing
});