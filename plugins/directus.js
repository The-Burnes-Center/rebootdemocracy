import { createDirectus, rest, readItem, readItems } from '@directus/sdk';

const directus = createDirectus('https://burnes-center.directus.app/').with(rest());

export default defineNuxtPlugin(() => {
	return {
		provide: { directus, readItem, readItems },
	};
});