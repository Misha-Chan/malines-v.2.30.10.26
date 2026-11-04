package com.malines.app.data

import android.app.Application
import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import okhttp3.WebSocket

class AppViewModel(app: Application) : AndroidViewModel(app) {

    private val repository = Repository(app)
    private val prefs = app.getSharedPreferences("malines", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    val playerId = "player_admin"
    val stateId = "ottoman"

    var baseUrl by mutableStateOf(prefs.getString("baseUrl", "http://10.0.2.2:4000") ?: "http://10.0.2.2:4000")
        private set

    var snapshot by mutableStateOf<SarSnapshot?>(null)
        private set

    var polygons by mutableStateOf<List<MapPolygon>>(emptyList())
        private set

    var loading by mutableStateOf(false)
        private set

    var message by mutableStateOf<String?>(null)

    var localDecisions by mutableStateOf<List<LocalDecision>>(emptyList())
        private set

    private var liveSocket: WebSocket? = null

    init {
        viewModelScope.launch {
            runCatching { repository.loadRegion() }
                .onSuccess { polygons = it }
                .onFailure { message = "تعذر تحميل الخريطة: ${it.message}" }
        }
        refresh()
        connectLive()
    }

    fun updateServerUrl(value: String) {
        baseUrl = value
        prefs.edit().putString("baseUrl", value).apply()
        connectLive()
    }

    private fun connectLive() {
        liveSocket?.close(1000, "reconnect")
        runCatching {
            liveSocket = repository.connectLive(baseUrl) { message ->
                if (!message.contains("\"type\":\"hello\"")) refresh()
            }
        }
    }

    fun refresh() {
        loading = true
        viewModelScope.launch {
            runCatching { repository.fetchSar(baseUrl) }
                .onSuccess {
                    snapshot = it
                    message = null
                }
                .onFailure { message = "تعذر الاتصال: ${it.message}" }
            loading = false
        }
    }

    fun importSar(text: String): Boolean {
        return runCatching {
            snapshot = json.decodeFromString(SarSnapshot.serializer(), text)
            message = "تم استيراد SAR.json"
            true
        }.getOrElse {
            message = "ملف غير صالح: ${it.message}"
            false
        }
    }

    fun addLocalDecision(kind: String, action: String) {
        val gameTime = snapshot?.time?.gameTime ?: return
        localDecisions = localDecisions + LocalDecision(kind, action, gameTime)
        message = "أُضيف قرار محلي (${localDecisions.size})"
    }

    fun sendAllLive() {
        val pending = localDecisions
        if (pending.isEmpty()) {
            message = "لا قرارات محلية"
            return
        }
        loading = true
        viewModelScope.launch {
            var sent = 0
            for (decision in pending) {
                runCatching {
                    repository.sendDecision(baseUrl, playerId, stateId, decision.kind, decision.action, decision.gameTime)
                }.onSuccess { sent++ }
            }
            localDecisions = localDecisions.drop(sent)
            message = if (sent > 0) "أُرسل $sent قرار" else "فشل الإرسال"
            loading = false
        }
    }

    fun ndsvJson(): String? {
        val sar = snapshot ?: return null
        return repository.buildNdsv(
            playerId = playerId,
            stateId = stateId,
            gameTime = sar.time.gameTime,
            snapshotId = sar.meta.snapshotId,
            decisions = localDecisions,
        )
    }

    fun clearLocalDecisions() {
        localDecisions = emptyList()
    }
}
