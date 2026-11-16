package expo.modules.stillreminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.ResultReceiver
import androidx.annotation.Keep
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.notifications.ArgumentsNotificationContentBuilder
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.triggers.ChannelAwareTrigger
import expo.modules.notifications.notifications.triggers.DailyTrigger
import expo.modules.notifications.notifications.triggers.WeeklyTrigger
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.delegates.ExpoSchedulingDelegate
import kotlinx.parcelize.Parcelize
import java.util.Calendar
import java.util.Date

class StillRemindersModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("StillReminders")

    AsyncFunction("scheduleDeferred") { id: String, payload: ReadableArguments,
      startsOn: String, hour: Int, minute: Int, weekday: Int?, promise: Promise ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val (year, month, day) = startsOn.split('-').map(String::toInt)
      val content = ArgumentsNotificationContentBuilder(context).setPayload(payload).build()
      val trigger = DeferredReminderTrigger("habits", year, month, day, hour, minute, weekday)
      val receiver = object : ResultReceiver(Handler(Looper.getMainLooper())) {
        override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
          if (resultCode == NotificationsService.SUCCESS_CODE) {
            promise.resolve(null)
          } else {
            promise.reject("ERR_STILL_REMINDER_SCHEDULE", "Could not schedule the habit reminder.", null)
          }
        }
      }
      NotificationsService.schedule(context, NotificationRequest(id, content, trigger), receiver)
    }
  }
}

class ReminderTimeZoneReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_TIMEZONE_CHANGED) return
    val scheduler = ExpoSchedulingDelegate(context)
    for (request in scheduler.getAllScheduledNotifications()) {
      if (request.trigger is DeferredReminderTrigger) {
        NotificationsService.schedule(context, request)
      }
    }
  }
}

// Expo persists this trigger and asks it for the next occurrence after each delivery.
@Keep
@Parcelize
internal class DeferredReminderTrigger(
  override val channelId: String?,
  private val year: Int,
  private val month: Int,
  private val day: Int,
  private val hour: Int,
  private val minute: Int,
  private val weekday: Int?,
) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {
  companion object {
    private const val serialVersionUID = 1L
  }

  private fun recurringTrigger(): SchedulableNotificationTrigger =
    if (weekday == null) DailyTrigger(channelId, hour, minute)
    else WeeklyTrigger(channelId, weekday, hour, minute)

  override fun toBundle() = recurringTrigger().toBundle()

  override fun nextTriggerDate(): Date? {
    val first = Calendar.getInstance().apply {
      clear()
      set(year, month - 1, day, 12, 0)
      if (weekday != null) add(Calendar.DATE, (weekday - get(Calendar.DAY_OF_WEEK) + 7) % 7)
      set(Calendar.HOUR_OF_DAY, hour)
      set(Calendar.MINUTE, minute)
    }.time

    return if (first.after(Date())) first else recurringTrigger().nextTriggerDate()
  }
}
