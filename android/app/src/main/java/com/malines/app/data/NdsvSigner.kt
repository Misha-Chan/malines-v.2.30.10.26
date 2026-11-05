package com.malines.app.data

import android.content.Context
import android.util.Base64
import java.security.KeyFactory
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.MessageDigest
import java.security.Signature
import java.security.spec.ECGenParameterSpec
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec

/**
 * Signs offline snapshots with an ECDSA P-256 key owned by the device.
 * The key is stored in private SharedPreferences for the beta; Android
 * Keystore is the next step before public release.
 */
class NdsvSigner(context: Context) {

    private val prefs = context.getSharedPreferences("malines-ndsv", Context.MODE_PRIVATE)

    private val keyPair: KeyPair = loadOrCreate()

    val publicKeyB64: String = Base64.encodeToString(keyPair.public.encoded, Base64.NO_WRAP)

    val keyId: String by lazy {
        val digest = MessageDigest.getInstance("SHA-256").digest(publicKeyB64.toByteArray(Charsets.UTF_8))
        "app-ecdsa-" + digest.joinToString("") { "%02x".format(it) }.take(16)
    }

    fun sign(canonicalPayload: String): String {
        val signature = Signature.getInstance("SHA256withECDSA")
        signature.initSign(keyPair.private)
        signature.update(canonicalPayload.toByteArray(Charsets.UTF_8))
        return Base64.encodeToString(signature.sign(), Base64.NO_WRAP)
    }

    private fun loadOrCreate(): KeyPair {
        val privateKey = prefs.getString("privateKey", null)
        val publicKey = prefs.getString("publicKey", null)
        if (privateKey != null && publicKey != null) {
            runCatching {
                val factory = KeyFactory.getInstance("EC")
                val public = factory.generatePublic(X509EncodedKeySpec(Base64.decode(publicKey, Base64.NO_WRAP)))
                val private = factory.generatePrivate(PKCS8EncodedKeySpec(Base64.decode(privateKey, Base64.NO_WRAP)))
                return KeyPair(public, private)
            }
        }
        return createAndStore()
    }

    private fun createAndStore(): KeyPair {
        val generator = KeyPairGenerator.getInstance("EC")
        generator.initialize(ECGenParameterSpec("secp256r1"))
        val pair = generator.generateKeyPair()
        prefs.edit()
            .putString("privateKey", Base64.encodeToString(pair.private.encoded, Base64.NO_WRAP))
            .putString("publicKey", Base64.encodeToString(pair.public.encoded, Base64.NO_WRAP))
            .apply()
        return pair
    }
}
