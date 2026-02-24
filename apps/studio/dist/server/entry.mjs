import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BQFW5vJB.mjs';
import { manifest } from './manifest_Dhsaa8wC.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/assets/_---assetpath_.astro.mjs');
const _page2 = () => import('./pages/api/player/projects/_id_/scenario.astro.mjs');
const _page3 = () => import('./pages/api/projects/_id_/assets.astro.mjs');
const _page4 = () => import('./pages/api/projects/_id_/build.astro.mjs');
const _page5 = () => import('./pages/api/projects/_id_/rollback.astro.mjs');
const _page6 = () => import('./pages/api/projects/_id_/scenario.astro.mjs');
const _page7 = () => import('./pages/api/projects/_id_/validate.astro.mjs');
const _page8 = () => import('./pages/api/projects.astro.mjs');
const _page9 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["../../node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/api/assets/[...assetPath].js", _page1],
    ["src/pages/api/player/projects/[id]/scenario.js", _page2],
    ["src/pages/api/projects/[id]/assets.js", _page3],
    ["src/pages/api/projects/[id]/build.js", _page4],
    ["src/pages/api/projects/[id]/rollback.js", _page5],
    ["src/pages/api/projects/[id]/scenario.js", _page6],
    ["src/pages/api/projects/[id]/validate/index.js", _page7],
    ["src/pages/api/projects/index.js", _page8],
    ["src/pages/index.astro", _page9]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///Users/uiwwsw/visual-novel/apps/studio/dist/client/",
    "server": "file:///Users/uiwwsw/visual-novel/apps/studio/dist/server/",
    "host": false,
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
