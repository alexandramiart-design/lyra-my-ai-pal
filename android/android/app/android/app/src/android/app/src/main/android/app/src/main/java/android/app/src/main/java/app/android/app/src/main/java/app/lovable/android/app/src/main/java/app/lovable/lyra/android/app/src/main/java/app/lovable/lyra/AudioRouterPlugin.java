package app.lovable.lyra;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioRouter")
public class AudioRouterPlugin extends Plugin {

    private AudioManager am() {
        return (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    private String kindOf(int type) {
        switch (type) {
            case AudioDeviceInfo.TYPE_BUILTIN_EARPIECE: return "earpiece";
            case AudioDeviceInfo.TYPE_BUILTIN_SPEAKER: return "speakerphone";
            case AudioDeviceInfo.TYPE_BLUETOOTH_SCO:
            case AudioDeviceInfo.TYPE_BLUETOOTH_A2DP: return "bluetooth";
            case AudioDeviceInfo.TYPE_WIRED_HEADSET:
            case AudioDeviceInfo.TYPE_WIRED_HEADPHONES:
            case AudioDeviceInfo.TYPE_USB_HEADSET: return "wired";
            default: return "other";
        }
    }

    @PluginMethod
    public void list(PluginCall call) {
        JSArray arr = new JSArray();
        try {
            AudioDeviceInfo[] devs = am().getDevices(AudioManager.GET_DEVICES_OUTPUTS);
            boolean hasEarpiece = false, hasSpeaker = false;
            for (AudioDeviceInfo d : devs) {
                String kind = kindOf(d.getType());
                if ("other".equals(kind)) continue;
                if ("earpiece".equals(kind)) hasEarpiece = true;
                if ("speakerphone".equals(kind)) hasSpeaker = true;
                JSObject o = new JSObject();
                o.put("id", String.valueOf(d.getId()));
                o.put("kind", kind);
                CharSequence name = d.getProductName();
                o.put("label", name != null ? name.toString() : kind);
                o.put("type", d.getType());
                arr.put(o);
            }
            // Ensure earpiece/speaker always present as virtual entries.
            if (!hasEarpiece) {
                JSObject o = new JSObject();
                o.put("id", "earpiece"); o.put("kind", "earpiece"); o.put("label", "Téléphone"); o.put("type", -1);
                arr.put(o);
            }
            if (!hasSpeaker) {
                JSObject o = new JSObject();
                o.put("id", "speakerphone"); o.put("kind", "speakerphone"); o.put("label", "Haut-parleur"); o.put("type", -1);
                arr.put(o);
            }
        } catch (Throwable t) {
            // fall through with empty
        }
        JSObject ret = new JSObject();
        ret.put("devices", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void setOutput(final PluginCall call) {
        final String kind = call.getString("kind", "earpiece");
        final String id = call.getString("id", "");
        try {
            final AudioManager am = am();
            am.setMode(AudioManager.MODE_IN_COMMUNICATION);

            if (Build.VERSION.SDK_INT >= 31) {
                // API 31+: setCommunicationDevice
                am.clearCommunicationDevice();
                AudioDeviceInfo target = null;
                AudioDeviceInfo[] devs = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                for (AudioDeviceInfo d : devs) {
                    String k = kindOf(d.getType());
                    boolean idMatch = id != null && !id.isEmpty() && id.equals(String.valueOf(d.getId()));
                    boolean kindMatch = k.equals(kind);
                    if (idMatch) { target = d; break; }
                    if (target == null && kindMatch) target = d;
                }
                if (target != null) am.setCommunicationDevice(target);
                am.setSpeakerphoneOn("speakerphone".equals(kind));
            } else {
                // Legacy path
                if ("bluetooth".equals(kind)) {
                    am.setSpeakerphoneOn(false);
                    try { am.startBluetoothSco(); } catch (Throwable ignored) {}
                    am.setBluetoothScoOn(true);
                } else if ("speakerphone".equals(kind)) {
                    try { am.stopBluetoothSco(); } catch (Throwable ignored) {}
                    am.setBluetoothScoOn(false);
                    am.setSpeakerphoneOn(true);
                } else { // earpiece
                    try { am.stopBluetoothSco(); } catch (Throwable ignored) {}
                    am.setBluetoothScoOn(false);
                    am.setSpeakerphoneOn(false);
                }
            }
            call.resolve();
        } catch (Throwable t) {
            call.reject(t.getMessage());
        }
    }

    @PluginMethod
    public void reset(PluginCall call) {
        try {
            AudioManager am = am();
            if (Build.VERSION.SDK_INT >= 31) {
                am.clearCommunicationDevice();
            } else {
                try { am.stopBluetoothSco(); } catch (Throwable ignored) {}
                am.setBluetoothScoOn(false);
            }
            am.setSpeakerphoneOn(false);
            am.setMode(AudioManager.MODE_NORMAL);
        } catch (Throwable ignored) {}
        call.resolve();
    }
}