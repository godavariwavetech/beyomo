package com.beyomo.otpautofill

import android.os.Build
import android.view.View
import android.view.autofill.AutofillManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/**
 * Re-opens the Android autofill session for whatever view currently has focus.
 *
 * The framework asks the autofill service for suggestions once, at the moment a field
 * takes focus. On the OTP screen that is a second after the code was requested and
 * several seconds before the SMS lands, so the service has nothing to offer and the
 * session closes — which is why the code never turns up above the keyboard on its own
 * unless the device is new enough to support delayed fills (Android 11+).
 *
 * Cancelling and re-requesting forces a fresh query, so the suggestion appears as soon
 * as the provider has actually seen the message. There is no React Native prop for
 * this; AutofillManager is the only way to ask.
 */
class OtpAutofillModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  private fun manager(): AutofillManager? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return null
    return try {
      currentActivity?.getSystemService(AutofillManager::class.java)
    } catch (e: Throwable) {
      null
    }
  }

  /** Whether the device has an autofill service enabled at all. */
  @ReactMethod
  fun isSupported(promise: Promise) {
    val autofill = manager()
    promise.resolve(autofill != null && autofill.isEnabled)
  }

  @ReactMethod
  fun requestAutofill(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      promise.resolve(nudge())
    }
  }

  @ReactMethod
  fun cancel(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        manager()?.cancel()
      } catch (e: Throwable) {
        // Nothing to cancel; not worth surfacing.
      }
      promise.resolve(null)
    }
  }

  private fun nudge(): Boolean {
    return try {
      val autofill = manager() ?: return false
      if (!autofill.isEnabled) return false

      val focused: View =
          currentActivity?.window?.decorView?.findFocus() ?: return false

      // A session is already open on this view from when it took focus, and
      // requestAutofill on a view inside a live session is ignored. Closing it first
      // is what makes the second ask actually reach the service.
      autofill.cancel()
      autofill.requestAutofill(focused)
      true
    } catch (e: Throwable) {
      false
    }
  }

  companion object {
    const val NAME = "OtpAutofill"
  }
}
