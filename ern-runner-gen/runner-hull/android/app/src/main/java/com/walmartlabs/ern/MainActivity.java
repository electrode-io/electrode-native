package com.walmartlabs.ern;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

{{^headless}}
import com.walmartlabs.ern.container.miniapps.{{{pascalCaseMiniAppName}}}Activity;
{{/headless}}

// This is the main activity that gets launched upon app start
// It just launches the activity containing the miniapp
// Feel free to modify it at your convenience.
public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        {{^headless}}
        Intent i = new Intent(this, {{{pascalCaseMiniAppName}}}Activity.class);
        this.startActivity(i);
        {{/headless}}
    }
}
