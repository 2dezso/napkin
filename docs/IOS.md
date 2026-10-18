# Building the iOS app

The website stays plain static files. The app is the same files wrapped by
Capacitor. `js/native.js` talks to the native side and does nothing on the web.

## One-off setup (on the Mac)

1. Install Node 20+ and Xcode (from the Mac App Store). Install CocoaPods: `sudo gem install cocoapods`.
2. In the repo: `npm install`
3. Add the iOS project: `npm run build:www && npx cap add ios`
4. `npm run ios:open`, then in Xcode: set your Team (the Apple Developer account) under Signing & Capabilities.
5. Check the bundle id in `capacitor.config.json` (`com.napkin.daily` is a placeholder). It cannot change once the app is created in App Store Connect.

## Things to fill in before it works

- **Purchases:** in App Store Connect create a non-consumable in-app purchase (e.g. `napkin_practice_unlock`, £1.99). In RevenueCat create a project, add the iOS app, make an entitlement called `practice_full`, attach the product, make it the current offering. Paste the public iOS key into `REVENUECAT_IOS_KEY` in `js/native.js`.
- **Notifications:** no server needed. The reminder is a local notification scheduled on the phone. Nothing to configure beyond the permission prompt.
- **Test purchases:** create a Sandbox tester in App Store Connect and sign in with it on the phone (Settings > Developer / App Store).

## Each time you change the site

`npm run ios:sync`, then run from Xcode. Bump the `?v=` numbers in `index.html` as usual for the website.

## What to check on a real phone

- Lock in a napkin: you should feel a thud; the verdict gives a second tap.
- Result screen: "Want a nudge tomorrow?" appears; picking a time asks for permission, and Stats > Daily reminder shows it set.
- Practice: the unlock shows Apple's price; buy with the sandbox account; Restore purchase works after deleting and reinstalling.
- The website must still show the old placeholder unlock and no reminder card.
