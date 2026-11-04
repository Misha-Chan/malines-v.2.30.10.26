package com.malines.app.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.double
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

data class LocalDecision(
    val kind: String,
    val action: String,
    val gameTime: String,
)

class Repository(private val context: Context) {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    /** Load the bundled 2D map for one region. */
    fun loadRegion(fileName: String = "map/region4.geojson"): List<MapPolygon> {
        val text = context.assets.open(fileName).bufferedReader().use { it.readText() }
        return parseRegionGeoJson(text)
    }

    private fun parseRegionGeoJson(text: String): List<MapPolygon> {
        val root = json.parseToJsonElement(text).jsonObject
        val features = root["features"]?.jsonArray ?: return emptyList()
        return features.mapNotNull { feature ->
            val obj = feature.jsonObject
            val props = obj["properties"]?.jsonObject ?: return@mapNotNull null
            val geometry = obj["geometry"]?.jsonObject ?: return@mapNotNull null
            if (geometry["type"]?.jsonPrimitive?.contentOrNull != "Polygon") return@mapNotNull null
            val ring = geometry["coordinates"]?.jsonArray?.firstOrNull()?.jsonArray ?: return@mapNotNull null

            val points = ring.mapNotNull { point ->
                val pair = point.jsonArray
                if (pair.size < 2) null else pair[0].jsonPrimitive.double to pair[1].jsonPrimitive.double
            }
            if (points.size < 3) return@mapNotNull null

            MapPolygon(
                id = props["id"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null,
                nameAr = props["name_ar"]?.jsonPrimitive?.contentOrNull ?: "",
                ownerId = props["owner"]?.jsonPrimitive?.contentOrNull,
                isSea = props["sea"]?.jsonPrimitive?.booleanOrNull ?: false,
                population = props["population"]?.jsonPrimitive?.int ?: 0,
                points = points,
            )
        }
    }

    suspend fun fetchSar(baseUrl: String): SarSnapshot = withContext(Dispatchers.IO) {
        val url = baseUrl.trimEnd('/') + "/api/sar"
        val request = Request.Builder().url(url).get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) error("HTTP ${response.code}")
            val body = response.body?.string() ?: error("empty response")
            json.decodeFromString(SarSnapshot.serializer(), body)
        }
    }

    suspend fun sendDecision(
        baseUrl: String,
        playerId: String,
        stateId: String,
        kind: String,
        action: String,
        gameTime: String,
    ): String = withContext(Dispatchers.IO) {
        val payload = buildJsonObject {
            put("playerId", playerId)
            put("stateId", stateId)
            put("kind", kind)
            put("action", action)
            put("gameTime", gameTime)
            put("payload", buildJsonObject { })
            put("source", "live")
        }
        val request = Request.Builder()
            .url(baseUrl.trimEnd('/') + "/api/decisions")
            .post(payload.toString().toRequestBody("application/json".toMediaType()))
            .build()
        client.newCall(request).execute().use { response ->
            val body = response.body?.string() ?: ""
            if (!response.isSuccessful) error("HTTP ${response.code}: $body")
            body
        }
    }

    /** Build a local nDSV snapshot (signature is added in a later beta). */
    fun buildNdsv(
        playerId: String,
        stateId: String,
        gameTime: String,
        snapshotId: String,
        decisions: List<LocalDecision>,
    ): String = buildJsonObject {
        put("format", "malines.ndsv")
        put("version", "1.1.0.13")
        put("playerId", playerId)
        put("stateId", stateId)
        put("gameTime", gameTime)
        put("createdAt", java.time.Instant.now().toString())
        put("baseSnapshotId", snapshotId)
        put("decisions", buildJsonArray {
            decisions.forEach { decision ->
                add(buildJsonObject {
                    put("id", "local_" + System.currentTimeMillis().toString(36) + "_" + (0..999).random())
                    put("kind", decision.kind)
                    put("action", decision.action)
                    put("gameTime", decision.gameTime)
                    put("payload", buildJsonObject { })
                })
            }
        })
        put("signature", "")
        put("keyId", "app-placeholder")
    }.toString()
}
