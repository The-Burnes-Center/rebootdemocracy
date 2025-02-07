/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'vue-router'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
    '/about': RouteRecordInfo<'/about', '/about', Record<never, never>, Record<never, never>>,
    '/all-blog-posts': RouteRecordInfo<'/all-blog-posts', '/all-blog-posts', Record<never, never>, Record<never, never>>,
    '/blog/[slug]': RouteRecordInfo<'/blog/[slug]', '/blog/:slug', { slug: ParamValue<true> }, { slug: ParamValue<false> }>,
    '/blog/[slug]__': RouteRecordInfo<'/blog/[slug]__', '/blog/:slug()__', { slug: ParamValue<true> }, { slug: ParamValue<false> }>,
    '/events': RouteRecordInfo<'/events', '/events', Record<never, never>, Record<never, never>>,
    '/more-resources': RouteRecordInfo<'/more-resources', '/more-resources', Record<never, never>, Record<never, never>>,
    '/our-engagements': RouteRecordInfo<'/our-engagements', '/our-engagements', Record<never, never>, Record<never, never>>,
    '/our-research': RouteRecordInfo<'/our-research', '/our-research', Record<never, never>, Record<never, never>>,
    '/our-teaching': RouteRecordInfo<'/our-teaching', '/our-teaching', Record<never, never>, Record<never, never>>,
    '/our-writing': RouteRecordInfo<'/our-writing', '/our-writing', Record<never, never>, Record<never, never>>,
  }
}
