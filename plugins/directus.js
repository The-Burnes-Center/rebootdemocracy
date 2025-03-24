import { createDirectus, rest, readItem, readItems } from '@directus/sdk';

const directus = createDirectus('https://content.thegovlab.com').with(rest());

export default defineNuxtPlugin(() => {
	return {
		provide: { directus, readItem, readItems },
	};
});