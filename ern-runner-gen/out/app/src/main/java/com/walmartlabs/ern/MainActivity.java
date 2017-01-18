package com.walmartlabs.ern;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

import com.walmartlabs.ern.container.miniapps.RhinocerosTwoActivity;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Intent i = new Intent(this, RhinocerosTwoActivity.class);
        this.startActivity(i);
    }

}
