package com.malines.app.data

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

/**
 * Deterministic JSON serialization mirroring the server's canonicalJson:
 * object keys are sorted recursively and strings use JSON escaping.
 */
object CanonicalJson {

    fun encode(element: JsonElement): String = when (element) {
        is JsonNull -> "null"
        is JsonObject -> element.keys.sorted().joinToString(",", "{", "}") { key ->
            "\"${escape(key)}\":" + encode(element.getValue(key))
        }
        is JsonArray -> element.joinToString(",", "[", "]") { encode(it) }
        is JsonPrimitive -> if (element.isString) "\"${escape(element.content)}\"" else element.toString()
    }

    private fun escape(value: String): String = buildString(value.length + 8) {
        for (ch in value) {
            when (ch) {
                '"' -> append("\\\"")
                '\\' -> append("\\\\")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                '\b' -> append("\\b")
                '\u000C' -> append("\\f")
                else -> if (ch < ' ') {
                    append("\\u")
                    append(ch.code.toString(16).padStart(4, '0'))
                } else {
                    append(ch)
                }
            }
        }
    }
}
