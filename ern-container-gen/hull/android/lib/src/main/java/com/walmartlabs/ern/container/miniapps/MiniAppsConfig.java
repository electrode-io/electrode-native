package com.walmartlabs.ern.container.miniapps;


// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// THIS CLASS IS AUTO GENERATED.
// DO NOT EDIT MANUALLY
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import java.util.HashMap;

public class MiniAppsConfig {

    {{#android}}
    {{#hasMultipleMiniApps}}
    public static final HashMap<String, Class> MINIAPP_ACTIVITIES = new HashMap<String, Class>() {{=<% %>=}}{{<%={{ }}=%>
        {{#miniapps}}
        put("{{unscopedName}}", {{unscopedName}}Activity.class);
        {{/miniapps}}
    {{=<% %>=}}}};<%={{ }}=%>
    {{/hasMultipleMiniApps}}
    {{/android}}
}
