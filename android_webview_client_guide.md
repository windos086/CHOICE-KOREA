# Capacitor Android WebView URL Interceptor Guide (WebViewClient)

Capacitor Android utilizes a customized WebView built on top of Android's `WebViewClient`. By default, certain links or custom URL schemes might be redirected to the device's system browser. 

To solve this issue (especially for **Kakao Login**, internal page transitions, or deep linking) and keep all page loads inside the app's WebView while correctly forwarding custom app schemes (like `intent:` or native KakaoTalk app paths) to external apps, you can extend Capacitor's native `BridgeWebViewClient`.

---

## 1. Java Implementation (`MainActivity.java`)

If your Capacitor Android app is written in **Java**, replace the contents of your `android/app/src/main/java/{YOUR_PACKAGE_NAME}/MainActivity.java` with the following:

```java
package com.example.app; // Change this to match your real app package name

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onStart() {
        super.onStart();
        
        // 1. Gain access to the underlying WebView configured by Capacitor
        WebView webView = this.getBridge().getWebView();
        
        // 2. Set a custom WebViewClient inheriting from Capacitor's BridgeWebViewClient 
        // to preserve core Capacitor internal plugin bridges.
        webView.setWebViewClient(new BridgeWebViewClient(this.getBridge()) {
            
            // Handles URL loading on Android 7.0 (API Level 24) and above
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                return handleUrlRouting(view, url);
            }
            
            // Handles URL loading on older Android versions (API Level < 24)
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrlRouting(view, url);
            }
            
            /**
             * Core URL Routing handler.
             * Keeps standard web links (http, https) inside the app's WebView.
             * Forwards custom deep links (intent:, kakaolink:, etc.) to local system handlers.
             */
            private boolean handleUrlRouting(WebView view, String url) {
                // If it's a standard web URL, let WebView handle it internally (do NOT launch system browser)
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false; // returning false tells WebView to load the URL inside
                }
                
                // If it is a custom deep-link scheme (e.g. KakaoTalk deep-link or intent schemes)
                try {
                    Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                    if (intent != null) {
                        Context context = getContext();
                        
                        // Check if an application can handle this scheme on the device
                        if (context.getPackageManager().resolveActivity(intent, 0) != null) {
                            context.startActivity(intent);
                            return true; // Deep link handled successfully
                        }
                        
                        // Fallback handling: e.g., if KakaoTalk is not installed, route to web/App Store URL
                        String fallbackUrl = intent.getStringExtra("browser_fallback_url");
                        if (fallbackUrl != null) {
                            view.loadUrl(fallbackUrl);
                            return true;
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
                
                // Default fallback to Capacitor's internal handler
                return super.shouldOverrideUrlLoading(view, url);
            }
        });
    }
}
```

---

## 2. Kotlin Implementation (`MainActivity.kt`)

If your Capacitor Android app is written in **Kotlin**, replace the contents of your `android/app/src/main/impl/MainActivity.kt` with the following:

```kotlin
package com.example.app // Change this to match your real app package name

import android.content.Intent
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import com.getcapacitor.BridgeActivity
import com.getcapacitor.BridgeWebViewClient

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }

    override fun onStart() {
        super.onStart()
        
        val webView = bridge.webView
        webView.webViewClient = object : BridgeWebViewClient(bridge) {
            
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                return handleUrlRouting(view, url)
            }

            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                return handleUrlRouting(view, url)
            }
            
            private fun handleUrlRouting(view: WebView, url: String): Boolean {
                // Keep standard HTTP & HTTPS links inside the WebView
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false // Let WebView load the URL internally
                }
                
                // Intercept custom app intent URL schemes (e.g., intent://, kakaotalk://)
                try {
                    val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                    if (intent != null) {
                        val packageManager = context.packageManager
                        if (intent.resolveActivity(packageManager) != null) {
                            context.startActivity(intent)
                            return true
                        }
                        
                        // Handled Fallback Option
                        val fallbackUrl = intent.getStringExtra("browser_fallback_url")
                        if (fallbackUrl != null) {
                            view.loadUrl(fallbackUrl)
                            return true
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                
                return super.shouldOverrideUrlLoading(view, url)
            }
        }
    }
}
```

---

---

## 3. Package Visibility for Android 11+ (`AndroidManifest.xml`)

Since Android 11 (API Level 30), Google enforced **Package Visibility Restrictions**. If you try to query custom schemes (like `com.kakao.talk`) without declaring them, `resolveActivity` will return `null` even if the app is installed.

To fix this, edit your `android/app/src/main/AndroidManifest.xml` and add the `<queries>` element directly inside the root `<manifest>` element (sibling to `<application>`):

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.app">

    <!-- Add other package visibility rules here -->
    <queries>
        <!-- Package name for KakaoTalk app to resolve intent protocols -->
        <package android:name="com.kakao.talk" />
    </queries>

    <application>
        ...
    </application>
</manifest>
```

---

## 4. Capacitor WebView Navigation Configuration (`capacitor.config.json`)

By default, Capacitor blocks external page navigations (such as redirecting the main window to `https://kauth.kakao.com`) and opens them in an external system browser to protect the user. To allow the Kakao login page to load directly within the same app WebView *without* launching a new browser window, you **MUST** configure the `server.allowNavigation` field in your `capacitor.config.json` at the root of your web project.

Create or update your `capacitor.config.json` with the following configuration:

```json
{
  "appId": "com.choicekorea.app",
  "appName": "초이스 코리아",
  "webDir": "dist",
  "server": {
    "allowNavigation": [
      "kauth.kakao.com",
      "kapi.kakao.com",
      "choicekr.co.kr",
      "*.kakao.com",
      "*.choicekr.co.kr"
    ]
  }
}
```

After updating this config, you must run the sync command to apply it to your native Android project:
```bash
npm run build
npx cap sync android
```

---

### Why this works:
1. **Inherits BridgeWebViewClient**: By subclassing `BridgeWebViewClient` instead of `WebViewClient`, we don't block or break Capacitor's internal runtime mechanics, asset servers, or bridges.
2. **Capacitor Navigation Permissions**: Setting `allowNavigation` in `capacitor.config.json` authorizes Capacitor's JS native bridge to allow webview redirection to `kauth.kakao.com` instead of immediately bouncing page requests to external system browsers.
3. **Returns `false` for http/https in WebView**: Directs the Android WebView to carry out standard browser navigation **locally within the active WebView layout** instead of launching secondary OS intents (preventing the browser address bar frame from mounting).
4. **Graceful Intent Parsing**: Recognizes implicit native intents. If the target application is present (e.g. KakaoTalk), it passes navigation over to the mobile system seamlessly. Otherwise, it defaults back to browser-rendered versions.
