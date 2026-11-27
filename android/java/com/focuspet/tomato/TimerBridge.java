package com.focuspet.tomato;

import android.webkit.JavascriptInterface;

/**
 * JS ←→ 原生 桥接对象，注入名为 AndroidTimer
 */
public class TimerBridge {

    private final MainActivity act;

    public TimerBridge(MainActivity a) {
        this.act = a;
    }

    /** 设定倒计时闹钟（到点由广播接收器发通知） */
    @JavascriptInterface
    public void scheduleAlarm(final long triggerAt, final String title, final String body) {
        act.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                act.scheduleAlarm(triggerAt, title, body);
            }
        });
    }

    @JavascriptInterface
    public void cancelAlarm() {
        act.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                act.cancelAlarm();
            }
        });
    }

    /** 立即发一条通知（用于测试/即时提醒） */
    @JavascriptInterface
    public void notify(final String title, final String body) {
        act.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                act.showNotification(title, body);
            }
        });
    }

    @JavascriptInterface
    public void vibrate(final int ms) {
        act.vibrate(ms);
    }

    @JavascriptInterface
    public void awake(final boolean on) {
        act.keepAwake(on);
    }

    @JavascriptInterface
    public void toast(final String msg) {
        act.shortToast(msg);
    }

    @JavascriptInterface
    public String platform() {
        return "android";
    }

    @JavascriptInterface
    public String version() {
        return "1.0";
    }
}
