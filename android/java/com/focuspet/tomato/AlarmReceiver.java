package com.focuspet.tomato;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;

/** 闹钟触发：发通知 + 唤醒屏幕 */
public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        if (title == null) title = "专注结束";
        if (body == null) body = "起来活动一下，宠物在等你 🐾";

        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = null;
        if (pm != null) {
            try {
                wl = pm.newWakeLock(
                        PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                        "focuspet:alarm");
                wl.acquire(5000);
            } catch (Exception e) {
                wl = null;
            }
        }

        NotificationHelper.show(ctx, title, body);

        if (wl != null) {
            try {
                if (wl.isHeld()) wl.release();
            } catch (Exception ignored) {
            }
        }
    }
}
