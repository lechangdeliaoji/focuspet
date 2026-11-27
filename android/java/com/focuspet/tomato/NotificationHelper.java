package com.focuspet.tomato;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;

/** 静态通知工具：广播接收器无法持有 Activity 时使用 */
public final class NotificationHelper {

    public static final String CH_ID = "focus_timer";
    private static final int NOTIFY_ID = 1001;

    private NotificationHelper() {
    }

    public static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel(CH_ID, "专注提醒", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("番茄钟到点提醒");
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[]{0, 260, 140, 260});
        ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
        nm.createNotificationChannel(ch);
    }

    public static void show(Context ctx, String title, String body) {
        ensureChannel(ctx);
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Intent open = new Intent(ctx, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent cpi = PendingIntent.getActivity(ctx, 7, open, flags);

        String t = (title == null || title.length() == 0) ? "番茄宠物" : title;
        String m = body == null ? "" : body;

        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            b = new Notification.Builder(ctx, CH_ID);
        } else {
            b = new Notification.Builder(ctx);
            b.setPriority(Notification.PRIORITY_HIGH);
            b.setDefaults(Notification.DEFAULT_SOUND | Notification.DEFAULT_VIBRATE);
        }
        b.setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(t)
                .setContentText(m)
                .setStyle(new Notification.BigTextStyle().bigText(m))
                .setAutoCancel(true)
                .setContentIntent(cpi)
                .setWhen(System.currentTimeMillis())
                .setShowWhen(true);

        try {
            nm.notify(NOTIFY_ID, b.build());
        } catch (SecurityException ignored) {
            // 通知权限被拒，静默处理
        }
    }
}
