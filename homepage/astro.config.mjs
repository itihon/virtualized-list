// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
      favicon: './src/assets/hero-image-1.png',
			title: 'Layout virtual',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/itihon/layout-virtual' }],
			sidebar: [
				{
					label: 'Examples',
					items: [{ autogenerate: { directory: 'examples' } }],
				},
			],
		}),
	],
});
