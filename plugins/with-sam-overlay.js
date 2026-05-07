const {
  withAndroidManifest,
  withAndroidStyles,
  AndroidConfig,
} = require("expo/config-plugins");

const OVERLAY_THEME = "Theme.Sam.Overlay";

const withOverlayTheme = (config) =>
  withAndroidStyles(config, (cfg) => {
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: { name: OVERLAY_THEME, parent: "Theme.AppCompat.DayNight.NoActionBar" },
      name: "android:windowBackground",
      value: "@android:color/transparent",
    });
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: { name: OVERLAY_THEME, parent: "Theme.AppCompat.DayNight.NoActionBar" },
      name: "android:windowIsTranslucent",
      value: "true",
    });
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: { name: OVERLAY_THEME, parent: "Theme.AppCompat.DayNight.NoActionBar" },
      name: "android:statusBarColor",
      value: "@android:color/transparent",
    });
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: { name: OVERLAY_THEME, parent: "Theme.AppCompat.DayNight.NoActionBar" },
      name: "android:navigationBarColor",
      value: "@android:color/transparent",
    });
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: { name: OVERLAY_THEME, parent: "Theme.AppCompat.DayNight.NoActionBar" },
      name: "android:windowAnimationStyle",
      value: "@android:style/Animation.Translucent",
    });
    return cfg;
  });

const withOverlayActivity = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );
    const mainActivity = app.activity?.find(
      (a) => a.$["android:name"] === ".MainActivity",
    );
    if (!mainActivity) return cfg;

    mainActivity.$["android:theme"] = `@style/${OVERLAY_THEME}`;
    mainActivity.$["android:showWhenLocked"] = "true";
    mainActivity.$["android:turnScreenOn"] = "true";
    mainActivity.$["android:excludeFromRecents"] = "true";

    const filters = mainActivity["intent-filter"] ?? [];
    const hasAssist = filters.some((f) =>
      f.action?.some((a) => a.$["android:name"] === "android.intent.action.ASSIST"),
    );
    if (!hasAssist) {
      filters.push({
        action: [{ $: { "android:name": "android.intent.action.ASSIST" } }],
        category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
      });
      mainActivity["intent-filter"] = filters;
    }
    return cfg;
  });

module.exports = (config) => {
  config = withOverlayTheme(config);
  config = withOverlayActivity(config);
  return config;
};
