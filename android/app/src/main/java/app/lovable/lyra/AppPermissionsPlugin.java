package app.lovable.lyra;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "AppPermissions")
public class AppPermissionsPlugin extends Plugin {

    private String[] wanted() {
        List<String> p = new ArrayList<>();
        p.add(Manifest.permission.RECORD_AUDIO);
        p.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);
        p.add(Manifest.permission.CAMERA);
        if (Build.VERSION.SDK_INT >= 33) {
            p.add(Manifest.permission.POST_NOTIFICATIONS);
            p.add(Manifest.permission.READ_MEDIA_IMAGES);
            p.add(Manifest.permission.READ_MEDIA_AUDIO);
        } else {
            p.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            p.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        }
        if (Build.VERSION.SDK_INT >= 31) {
            p.add(Manifest.permission.BLUETOOTH_CONNECT);
        }
        return p.toArray(new String[0]);
    }

    @PluginMethod
    public void requestAll(PluginCall call) {
        List<String> missing = new ArrayList<>();
        for (String perm : wanted()) {
            if (ContextCompat.checkSelfPermission(getContext(), perm) != PackageManager.PERMISSION_GRANTED) {
                missing.add(perm);
            }
        }
        if (!missing.isEmpty()) {
            ActivityCompat.requestPermissions(getActivity(), missing.toArray(new String[0]), 9931);
        }
        call.resolve();
    }
}
