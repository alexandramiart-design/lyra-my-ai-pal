package app.lovable.lyra;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AudioRouterPlugin.class);
        registerPlugin(AppPermissionsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
