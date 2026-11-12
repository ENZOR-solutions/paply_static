/* PostHog product analytics (EU Cloud), shared project with paply.app.
   Cookieless: nothing is stored in the browser, so no consent banner is
   needed. Needs "Cookieless server hash mode" switched on in the PostHog
   project settings, otherwise events are dropped.
   Runs only on the production domain (not localhost or Vercel previews). */
(function () {
  'use strict';
  if (!/(^|\.)paply\.si$/.test(location.hostname)) return;

  // Official PostHog loader stub (queues calls until array.js has loaded).
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags on onFeatureFlags onSessionId identify setPersonProperties group resetGroups reset get_distinct_id getGroups get_session_id alias set_config captureException get_property getSessionProperty opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  window.posthog.init('phc_u49Yp6Z6PMXNQsYcFxyUt9wB8eJmbbbNsg3fxTgBL4yq', {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2025-05-24',
    cookieless_mode: 'always',
    person_profiles: 'identified_only',
    // Same as paply.app: honours Do Not Track / Global Privacy Control
    // (Privacy Policy section 3); no recordings, surveys or feature flags.
    respect_dnt: true,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_feature_flags: true,
    advanced_disable_feature_flags_on_first_load: true
  });
  window.posthog.register({ site_lang: document.documentElement.lang || 'en' });

  // One clean event for every jump to the product, e.g. funnel
  // "$pageview on /pricing/" -> "app_link_clicked (target = register)".
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="https://paply.app"]');
    if (!a) return;
    var path = a.pathname.replace(/^\/+|\/+$/g, '') || 'home';
    window.posthog.capture('app_link_clicked', {
      target: path,
      link_text: (a.textContent || '').trim().slice(0, 80),
      page_path: location.pathname
    });
  }, true);
})();
