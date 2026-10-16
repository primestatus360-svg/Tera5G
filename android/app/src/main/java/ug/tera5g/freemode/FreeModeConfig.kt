package ug.tera5g.freemode

data class FreeModeConfig(
    val index: Int,
    val endpoint: String,
    val privateKey: String,
    val serverPublicKey: String
)
