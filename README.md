# Sam

Assistante personnelle vocale inspirée de l'IA du film *Her*. Application Android (Expo SDK 55) — agenda, todos, conversation en français, lancée par appui long sur la touche latérale du Galaxy Z Fold 7.

A French-first voice assistant inspired by *Her*. Android app (Expo SDK 55) — calendar, todos, voice conversation in French, launched by long-pressing the Z Fold 7 side button.

---

## Stack

- React Native 0.83 / React 19.2 (New Architecture)
- Expo SDK 55, dev-client builds via EAS
- SQLite (drizzle-orm) — toutes les données restent locales
- OpenRouter (`openai/gpt-audio-mini`) pour la voix + tool calling
- expo-secure-store pour la clé API

## Build (dev)

```bash
npm install
eas login                                     # première fois
eas build --platform android --profile development
```

Installer l'APK généré sur le Z Fold 7. Ensuite, en local :

```bash
npm run android   # lance metro + installe sur l'appareil connecté
```

## Build sideload (APK preview)

```bash
eas build --platform android --profile preview
```

Récupérer l'APK et l'installer manuellement (paramètres → autoriser les sources inconnues pour l'app utilisée).

## Configuration

1. Première ouverture : accorder le micro.
2. Onglet **Settings** :
   - coller votre clé API OpenRouter (`sk-or-...`)
   - choisir la voix
   - renseigner votre prénom (Sam vous appellera de temps en temps)
3. Tester : onglet **Sam**, maintenir l'orbe et parler.

## Lancement par la touche latérale (Z Fold 7)

Sur One UI 8.x :

1. **Paramètres → Fonctions avancées → Touche latérale**
2. **Appuyer longuement → Ouvrir l'application**
3. Choisir **Sam**

L'appui long ouvrira Sam même quand le téléphone est verrouillé (`showWhenLocked` activé).

## Données

Aucune synchronisation cloud. Tout est dans `sam.db` (SQLite local). Reset complet : onglet **Settings → Danger zone → Clear all events and todos**.

## Structure

```
src/
├── agent/        # tools registry, turn loop, persona
├── db/           # sqlite + drizzle schemas + crud
├── settings/     # secure-store wrapper
├── ui/           # SamScreen, Orb, Transcript, Settings, Debug
└── voice/        # VoiceProvider interface, OpenRouter impl, recorder, player
plugins/
└── with-sam-overlay.js   # config plugin (translucent activity, ASSIST role)
```

## Hors scope (v2)

- Contrôle de YouTube Music
- Synchronisation Google Calendar / Tasks
- Wake-word ("Hey Sam")
- Vraie voix temps réel via OpenAI Realtime API (l'interface `VoiceProvider` est prévue pour le swap)
