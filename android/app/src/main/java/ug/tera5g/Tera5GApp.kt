package ug.tera5g

import android.app.Application

class Tera5GApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialization happens lazily in each component
    }
}
