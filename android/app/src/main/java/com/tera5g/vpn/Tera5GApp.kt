package com.tera5g.vpn

import android.app.Application
import com.tera5g.vpn.data.SessionManager

class Tera5GApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SessionManager.init(this)
    }
}
