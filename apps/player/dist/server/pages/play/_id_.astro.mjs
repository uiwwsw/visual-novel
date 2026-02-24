import { e as createComponent, r as renderTemplate, k as defineScriptVars, l as renderHead, g as addAttribute, h as createAstro } from '../../chunks/astro/server_BWx0qOMJ.mjs';
import 'piccolore';
import 'clsx';
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const prerender = false;
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const projectId = Astro2.params.id ?? "";
  const projectRef = encodeURIComponent(projectId);
  const target = `/?project=${projectRef}`;
  return renderTemplate(_a || (_a = __template(['<html lang="ko"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh"', "><title>Redirecting...</title>", "</head> <body> <script>(function(){", "\n      location.replace(target);\n    })();<\/script> <p>Redirecting to project player...</p> </body></html>"])), addAttribute(`0;url=${target}`, "content"), renderHead(), defineScriptVars({ target }));
}, "/Users/uiwwsw/visual-novel/apps/player/src/pages/play/[id].astro", void 0);

const $$file = "/Users/uiwwsw/visual-novel/apps/player/src/pages/play/[id].astro";
const $$url = "/play/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
