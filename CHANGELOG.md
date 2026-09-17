# Changelog

## [2.2.0](https://github.com/hamirilo/feedee/compare/v2.1.0...v2.2.0) (2026-09-17)


### Features

* リリース時に arm64 イメージを GHCR へ配布する ([d3805db](https://github.com/hamirilo/feedee/commit/d3805db97947a2593794fd61362117eba02bf372))
* リリース時に arm64 イメージを GHCR へ配布する ([a6eea15](https://github.com/hamirilo/feedee/commit/a6eea15a5ae51bc43bdff21ef355b8ba32da3424))


### Bug Fixes

* migration を PostgreSQL でも適用できるようにする ([5e68700](https://github.com/hamirilo/feedee/commit/5e68700e7d9913cc7d196e9e684cf896cae9b9c4))
* migration を PostgreSQL でも適用できるようにする ([0d942fa](https://github.com/hamirilo/feedee/commit/0d942fa1aafc0d4aa37cd61a923ecd4775534c9d))

## [2.1.0](https://github.com/hamirilo/feedee/compare/v2.0.0...v2.1.0) (2026-09-16)


### Features

* add @hamirilo/application-ui-kit dependency and configure GitHub package registry authentication ([53ca1a8](https://github.com/hamirilo/feedee/commit/53ca1a851056804a2e2b34ed30180b87a0988bbf))
* add bookmark item flags and refine sidebar/filter UX ([1fcabe0](https://github.com/hamirilo/feedee/commit/1fcabe04e710555af3fb6faceeb47d4bb70393a9))
* add bookmark promotion support for articles in the UI ([c7115e9](https://github.com/hamirilo/feedee/commit/c7115e9a45b91b5177fbd6743c51fe13d5a10024))
* add Catalyst-style app switcher UI for RSS/Bookmark ([95b8379](https://github.com/hamirilo/feedee/commit/95b83790a41e463e528d660b25f8ed4dd7429bed))
* add environment checks for standalone commands in Makefile ([651d9b0](https://github.com/hamirilo/feedee/commit/651d9b028e1fe6702793b0e4333a0cdb26126707))
* add flexible JSON and comma-separated string parsing for CORS allowed_origins configuration ([61d72aa](https://github.com/hamirilo/feedee/commit/61d72aa5e1be1b4f6b4fa05a318622006000d1af))
* add GitHub token support to Docker build for private package installation ([8a65767](https://github.com/hamirilo/feedee/commit/8a657673be4d2a8efaad5543dd82755fa411e5b8))
* add github_token secret to production compose configuration ([4397a28](https://github.com/hamirilo/feedee/commit/4397a2825a33ec47e73d1af2883a35d9acf4bf18))
* add local multi-proxy dev overlay (compose.local-proxy.yaml + Makefile) ([94951ed](https://github.com/hamirilo/feedee/commit/94951edca0f8a540ed77ced0cb141ebaa2259bdb))
* Add OPML import/export functionality and enhance feed fetching logic ([9a27473](https://github.com/hamirilo/feedee/commit/9a27473668e7de5e92f86796d3f6ba81b15fce33))
* add pinned and favorites sections with environment-based token storage and UI improvements ([af438ae](https://github.com/hamirilo/feedee/commit/af438ae1f584db93529641344ed75636442227c9))
* add real-time article removal and state filtering functionality ([279dcde](https://github.com/hamirilo/feedee/commit/279dcdec9d77d83bd03141cf03b698080d5fc8fa))
* add theme preference functionality and enhance article content extraction ([a1c8f78](https://github.com/hamirilo/feedee/commit/a1c8f7859bc73cecba9b7853ecb69a22e44f7d81))
* add UI and handlers for creating and navigating category and tag filters in sidebar ([be20451](https://github.com/hamirilo/feedee/commit/be204517e65a7fd7142e426d67f54db78c3d36c2))
* **backend:** add FastAPI + SQLAlchemy + Alembic Phase 1 scaffold ([d815fba](https://github.com/hamirilo/feedee/commit/d815fbad2f028b94485a91f2960de547fffbd8ea))
* enhance article display with list and card modes ([ca2e391](https://github.com/hamirilo/feedee/commit/ca2e39135cbcd527bafc1d04f2e74393a992a4ea))
* enhance bookmark actions with dropdown menu and improved accessibility ([4306707](https://github.com/hamirilo/feedee/commit/43067075a456918ab80b9c5bdeef05382572f105))
* enhance bookmark menu with icons and improved layout ([75e77a1](https://github.com/hamirilo/feedee/commit/75e77a17a62fdb9200383e6b48cb4549e3395c7b))
* implement archiving functionality for reading items with database support and API endpoints ([078254e](https://github.com/hamirilo/feedee/commit/078254e630dfd33e69900bbbf0b51f5d0555dbd3))
* implement bookmarklet popup for quick bookmarking and RSS subscription with discovery endpoint. ([d8e932e](https://github.com/hamirilo/feedee/commit/d8e932e4cff33bc36586130bf9c862645315fe43))
* implement core frontend UI components and initial project dependencies ([ebe95ef](https://github.com/hamirilo/feedee/commit/ebe95ef49773b936443e02c8163b508123c01efc))
* implement Django Ninja API structure and add administrative setup commands ([0307c51](https://github.com/hamirilo/feedee/commit/0307c51a27b280d715aeb955e6ecce936a3a3da1))
* implement frontend interactivity including theme syncing, UI toggles, and async state management via Alpine.js ([f59f1ec](https://github.com/hamirilo/feedee/commit/f59f1ec3050efb1b7bbc93e8f3798e1a29a86e82))
* implement OGP auto-fetching for bookmarks, add subscription/bookmark update functionality, and refine dev tooling ([45f6e0e](https://github.com/hamirilo/feedee/commit/45f6e0e200a9350f95a073a7ee3c137e3aecd211))
* implement sidebar navigation and integrate base UI components for feed management ([3c19060](https://github.com/hamirilo/feedee/commit/3c19060137cb7d4a78f41e7bc9a7b032c69c16cd))
* implement split-pane RSS reader with keyboard navigation and mobile-responsive layout ([c1b20ee](https://github.com/hamirilo/feedee/commit/c1b20ee6e178d5d073b40479ff35bb22fcbe696f))
* implement theme preference handling and reorder functionality for feeds ([a436e99](https://github.com/hamirilo/feedee/commit/a436e99c7c81f6012af4a3a3f9c9d9fac40856e2))
* implement toast system and confirm dialogs, upgrade ID types to UUID, and update CORS origins ([e572c06](https://github.com/hamirilo/feedee/commit/e572c0677cd885d359acba4d38326fafeff0f6ba))
* implement user registration and enhance authentication flow ([b97fe79](https://github.com/hamirilo/feedee/commit/b97fe79c0f786dcdc293a5a5d43b717e40034d6c))
* improve RSS feed registration error handling (Phase 1) ([3daec6e](https://github.com/hamirilo/feedee/commit/3daec6e47ea826d9841d2f09a9476d5272562e26))
* initialize frontend setup with Vite, Tailwind CSS, and PostCSS ([127c1c9](https://github.com/hamirilo/feedee/commit/127c1c90157936cbfad2a214508d320cb69aae20))
* initialize frontend setup with Vite, Tailwind CSS, and PostCSS ([106c192](https://github.com/hamirilo/feedee/commit/106c192b3467b8cc64ad5e7b7c075226455db16c))
* integrate ContentArea component into main page layout ([7f07f96](https://github.com/hamirilo/feedee/commit/7f07f96fb9554850b26cf706ccf4e99f18305c9c))
* integrate RSS and bookmark services into the application ([1436c67](https://github.com/hamirilo/feedee/commit/1436c676bfa8b7e3484e8835d42aa5bbf2ad9ef1))
* integrate WhiteNoise for static file serving, switch frontend build to bun, and update production deployment command ([0cff189](https://github.com/hamirilo/feedee/commit/0cff18909794851d9c8f0d97f9c21ca52b70a725))
* migrate backend to FastAPI and add superuser creation script ([22071c2](https://github.com/hamirilo/feedee/commit/22071c25ed832f8bc54a44fd53ec6c1931063d9d))
* move app switcher to logo area and search to main content top ([c843431](https://github.com/hamirilo/feedee/commit/c8434311995cfd0ab399c5c427c2c2e198a39b32))
* phase 1 - add ai-platform submodule and sync .claude ([99a4900](https://github.com/hamirilo/feedee/commit/99a4900f76939ac0c57584f2fbf85d4f0fda226d))
* phase 2 - integrate ai-platform tooling, ruff, pytest, and justfile recipes ([fa8e362](https://github.com/hamirilo/feedee/commit/fa8e362f5bc97b6dffe57cf91a098659450fd972))
* phase 3 - integrate icons templatetag and design system shared assets ([1b87d98](https://github.com/hamirilo/feedee/commit/1b87d98061606106eb68b648150ec7e853a9d036))
* replace feed favicons with Rss icons and add dynamic app icon generation ([463aef8](https://github.com/hamirilo/feedee/commit/463aef81e17235195633a85badd1485502dcdf28))
* unify settings page into single endpoint (Phase 2.2) ([bff8bf6](https://github.com/hamirilo/feedee/commit/bff8bf62059d3d12404a9aa6e7f3080d0464d930))
* unify sidebar with mode switching (Phase 2.1) ([366a64a](https://github.com/hamirilo/feedee/commit/366a64a772b55adfac38810ef69934505fa01693))
* update environment configuration and add standalone/infrastructure compose files ([b8e84c3](https://github.com/hamirilo/feedee/commit/b8e84c344ceda7147d3add3d1a50447d4296555c))
* update homepage URL to redirect to bookmarks page ([2765a2b](https://github.com/hamirilo/feedee/commit/2765a2b23017e51b2bb06cb3ae96fe9f38c87c8b))
* **v2:** migrate to Next.js + FastAPI + Go worker unified architecture ([528ccf4](https://github.com/hamirilo/feedee/commit/528ccf48123da8950adcfbac2011f7231d63eb79))


### Bug Fixes

* CI が検出した image build と biome の失敗を直す ([8fd41a3](https://github.com/hamirilo/feedee/commit/8fd41a35212210c1ea15dcb40487c9171989e711))
* correct redirect URLs in settings_view to use absolute paths ([0db3993](https://github.com/hamirilo/feedee/commit/0db3993e8a61e2d9ef5a9df06eba5450bd65aa4e))
* make WORKER_CHECK_INTERVAL_SECONDS configurable with default value ([dd23bca](https://github.com/hamirilo/feedee/commit/dd23bca92842546305be120277e6237a8761774d))
* move settings link outside sidebar modes to prevent layout issues ([8732d45](https://github.com/hamirilo/feedee/commit/8732d4539bfe6576ca00e104b30c1b2d5dd1eae5))
* optimize frontend startup by only installing dependencies when package.json changes ([26cadf7](https://github.com/hamirilo/feedee/commit/26cadf758faba218f966006039bb68bd90ee2ca8))
* register design tokens with Tailwind v4 and finish auth page styling ([cd4058a](https://github.com/hamirilo/feedee/commit/cd4058a26db0b9924e414fa89dae03260ec3b828))
* register design tokens with Tailwind v4 and finish auth page styling ([c676cb2](https://github.com/hamirilo/feedee/commit/c676cb2887cb7157c9f0ff56175ad9f97ec64d76))
* release tag に component 名が入らないようにする ([471b60a](https://github.com/hamirilo/feedee/commit/471b60a8fc90da1607346f11e715daab39793a3e))
* release tag に component 名が入らないようにする ([5cd161e](https://github.com/hamirilo/feedee/commit/5cd161e5d9635e1bd1b72dcea5cb3b0bc26aa270))
* remove orphaned fallback navigation causing template syntax error ([ec635c8](https://github.com/hamirilo/feedee/commit/ec635c8ce9290ee5f77fbff886134ab9818849eb))
* update web service port mapping from 8000 to 8082 ([8a4355f](https://github.com/hamirilo/feedee/commit/8a4355ff908d1266fc80a612afeff22a74343e03))

## Changelog

このファイルは Release Please により更新します。
