
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T extends DefineComponent> = T & DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>>
type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = (T & DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }>)
interface _GlobalComponents {
      'AuthorBadge': typeof import("../components/badge/AuthorBadge.vue")['default']
    'CuratorBadge': typeof import("../components/badge/CuratorBadge.vue")['default']
    'Button': typeof import("../components/button/Button.vue")['default']
    'AuthorCard': typeof import("../components/card/AuthorCard.vue")['default']
    'Card': typeof import("../components/card/Card.vue")['default']
    'InnovateUsCard': typeof import("../components/card/InnovateUsCard.vue")['default']
    'PostCard': typeof import("../components/card/PostCard.vue")['default']
    'UpcomingCard': typeof import("../components/card/UpcomingCard.vue")['default']
    'Footer': typeof import("../components/footer/Footer.vue")['default']
    'BlogHeader': typeof import("../components/header/BlogHeader.vue")['default']
    'DefaultHeader': typeof import("../components/header/DefaultHeader.vue")['default']
    'HeaderDropdown': typeof import("../components/header/HeaderDropdown.vue")['default']
    'HeaderMenu': typeof import("../components/header/HeaderMenu.vue")['default']
    'Hero': typeof import("../components/hero/Hero.vue")['default']
    'GlobalSearch': typeof import("../components/search/GlobalSearch.vue")['default']
    'TabSwitch': typeof import("../components/tab/TabSwitch.vue")['default']
    'Tags': typeof import("../components/tags/Tags.vue")['default']
    'BodyText': typeof import("../components/typography/BodyText.vue")['default']
    'ListCategory': typeof import("../components/typography/ListCategory.vue")['default']
    'Tag': typeof import("../components/typography/Tag.vue")['default']
    'Text': typeof import("../components/typography/Text.vue")['default']
    'TitleText': typeof import("../components/typography/TitleText.vue")['default']
    'SignUpButtonWidget': typeof import("../components/widget/SignUpButtonWidget.vue")['default']
    'NuxtWelcome': typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
    'NuxtLayout': typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
    'NuxtErrorBoundary': typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary")['default']
    'ClientOnly': typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
    'DevOnly': typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
    'ServerPlaceholder': typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
    'NuxtLink': typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
    'NuxtLoadingIndicator': typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
    'NuxtImg': typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtImg.vue")['default']
    'NuxtPicture': typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtPicture.vue")['default']
    'NuxtPage': typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
    'NoScript': typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
    'Link': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
    'Base': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
    'Title': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
    'Meta': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
    'Style': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
    'Head': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
    'Html': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
    'Body': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
    'NuxtIsland': typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
    'NuxtRouteAnnouncer': IslandComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
      'LazyAuthorBadge': LazyComponent<typeof import("../components/badge/AuthorBadge.vue")['default']>
    'LazyCuratorBadge': LazyComponent<typeof import("../components/badge/CuratorBadge.vue")['default']>
    'LazyButton': LazyComponent<typeof import("../components/button/Button.vue")['default']>
    'LazyAuthorCard': LazyComponent<typeof import("../components/card/AuthorCard.vue")['default']>
    'LazyCard': LazyComponent<typeof import("../components/card/Card.vue")['default']>
    'LazyInnovateUsCard': LazyComponent<typeof import("../components/card/InnovateUsCard.vue")['default']>
    'LazyPostCard': LazyComponent<typeof import("../components/card/PostCard.vue")['default']>
    'LazyUpcomingCard': LazyComponent<typeof import("../components/card/UpcomingCard.vue")['default']>
    'LazyFooter': LazyComponent<typeof import("../components/footer/Footer.vue")['default']>
    'LazyBlogHeader': LazyComponent<typeof import("../components/header/BlogHeader.vue")['default']>
    'LazyDefaultHeader': LazyComponent<typeof import("../components/header/DefaultHeader.vue")['default']>
    'LazyHeaderDropdown': LazyComponent<typeof import("../components/header/HeaderDropdown.vue")['default']>
    'LazyHeaderMenu': LazyComponent<typeof import("../components/header/HeaderMenu.vue")['default']>
    'LazyHero': LazyComponent<typeof import("../components/hero/Hero.vue")['default']>
    'LazyGlobalSearch': LazyComponent<typeof import("../components/search/GlobalSearch.vue")['default']>
    'LazyTabSwitch': LazyComponent<typeof import("../components/tab/TabSwitch.vue")['default']>
    'LazyTags': LazyComponent<typeof import("../components/tags/Tags.vue")['default']>
    'LazyBodyText': LazyComponent<typeof import("../components/typography/BodyText.vue")['default']>
    'LazyListCategory': LazyComponent<typeof import("../components/typography/ListCategory.vue")['default']>
    'LazyTag': LazyComponent<typeof import("../components/typography/Tag.vue")['default']>
    'LazyText': LazyComponent<typeof import("../components/typography/Text.vue")['default']>
    'LazyTitleText': LazyComponent<typeof import("../components/typography/TitleText.vue")['default']>
    'LazySignUpButtonWidget': LazyComponent<typeof import("../components/widget/SignUpButtonWidget.vue")['default']>
    'LazyNuxtWelcome': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
    'LazyNuxtLayout': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
    'LazyNuxtErrorBoundary': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary")['default']>
    'LazyClientOnly': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
    'LazyDevOnly': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
    'LazyServerPlaceholder': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
    'LazyNuxtLink': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
    'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
    'LazyNuxtImg': LazyComponent<typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtImg.vue")['default']>
    'LazyNuxtPicture': LazyComponent<typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtPicture.vue")['default']>
    'LazyNuxtPage': LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
    'LazyNoScript': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
    'LazyLink': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
    'LazyBase': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
    'LazyTitle': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
    'LazyMeta': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
    'LazyStyle': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
    'LazyHead': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
    'LazyHtml': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
    'LazyBody': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
    'LazyNuxtIsland': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<IslandComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export const AuthorBadge: typeof import("../components/badge/AuthorBadge.vue")['default']
export const CuratorBadge: typeof import("../components/badge/CuratorBadge.vue")['default']
export const Button: typeof import("../components/button/Button.vue")['default']
export const AuthorCard: typeof import("../components/card/AuthorCard.vue")['default']
export const Card: typeof import("../components/card/Card.vue")['default']
export const InnovateUsCard: typeof import("../components/card/InnovateUsCard.vue")['default']
export const PostCard: typeof import("../components/card/PostCard.vue")['default']
export const UpcomingCard: typeof import("../components/card/UpcomingCard.vue")['default']
export const Footer: typeof import("../components/footer/Footer.vue")['default']
export const BlogHeader: typeof import("../components/header/BlogHeader.vue")['default']
export const DefaultHeader: typeof import("../components/header/DefaultHeader.vue")['default']
export const HeaderDropdown: typeof import("../components/header/HeaderDropdown.vue")['default']
export const HeaderMenu: typeof import("../components/header/HeaderMenu.vue")['default']
export const Hero: typeof import("../components/hero/Hero.vue")['default']
export const GlobalSearch: typeof import("../components/search/GlobalSearch.vue")['default']
export const TabSwitch: typeof import("../components/tab/TabSwitch.vue")['default']
export const Tags: typeof import("../components/tags/Tags.vue")['default']
export const BodyText: typeof import("../components/typography/BodyText.vue")['default']
export const ListCategory: typeof import("../components/typography/ListCategory.vue")['default']
export const Tag: typeof import("../components/typography/Tag.vue")['default']
export const Text: typeof import("../components/typography/Text.vue")['default']
export const TitleText: typeof import("../components/typography/TitleText.vue")['default']
export const SignUpButtonWidget: typeof import("../components/widget/SignUpButtonWidget.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtImg.vue")['default']
export const NuxtPicture: typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtPicture.vue")['default']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const NuxtRouteAnnouncer: IslandComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyAuthorBadge: LazyComponent<typeof import("../components/badge/AuthorBadge.vue")['default']>
export const LazyCuratorBadge: LazyComponent<typeof import("../components/badge/CuratorBadge.vue")['default']>
export const LazyButton: LazyComponent<typeof import("../components/button/Button.vue")['default']>
export const LazyAuthorCard: LazyComponent<typeof import("../components/card/AuthorCard.vue")['default']>
export const LazyCard: LazyComponent<typeof import("../components/card/Card.vue")['default']>
export const LazyInnovateUsCard: LazyComponent<typeof import("../components/card/InnovateUsCard.vue")['default']>
export const LazyPostCard: LazyComponent<typeof import("../components/card/PostCard.vue")['default']>
export const LazyUpcomingCard: LazyComponent<typeof import("../components/card/UpcomingCard.vue")['default']>
export const LazyFooter: LazyComponent<typeof import("../components/footer/Footer.vue")['default']>
export const LazyBlogHeader: LazyComponent<typeof import("../components/header/BlogHeader.vue")['default']>
export const LazyDefaultHeader: LazyComponent<typeof import("../components/header/DefaultHeader.vue")['default']>
export const LazyHeaderDropdown: LazyComponent<typeof import("../components/header/HeaderDropdown.vue")['default']>
export const LazyHeaderMenu: LazyComponent<typeof import("../components/header/HeaderMenu.vue")['default']>
export const LazyHero: LazyComponent<typeof import("../components/hero/Hero.vue")['default']>
export const LazyGlobalSearch: LazyComponent<typeof import("../components/search/GlobalSearch.vue")['default']>
export const LazyTabSwitch: LazyComponent<typeof import("../components/tab/TabSwitch.vue")['default']>
export const LazyTags: LazyComponent<typeof import("../components/tags/Tags.vue")['default']>
export const LazyBodyText: LazyComponent<typeof import("../components/typography/BodyText.vue")['default']>
export const LazyListCategory: LazyComponent<typeof import("../components/typography/ListCategory.vue")['default']>
export const LazyTag: LazyComponent<typeof import("../components/typography/Tag.vue")['default']>
export const LazyText: LazyComponent<typeof import("../components/typography/Text.vue")['default']>
export const LazyTitleText: LazyComponent<typeof import("../components/typography/TitleText.vue")['default']>
export const LazySignUpButtonWidget: LazyComponent<typeof import("../components/widget/SignUpButtonWidget.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtImg.vue")['default']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtPicture.vue")['default']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<IslandComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>>

export const componentNames: string[]
