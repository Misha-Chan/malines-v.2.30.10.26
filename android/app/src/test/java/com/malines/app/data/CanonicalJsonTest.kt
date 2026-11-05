package com.malines.app.data

import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Assert.assertEquals
import org.junit.Test

class CanonicalJsonTest {

    @Test
    fun sortsKeysRecursively() {
        val value = buildJsonObject {
            put("b", 1)
            put("a", "س")
            put("c", buildJsonArray {
                add(buildJsonObject {
                    put("z", true)
                    put("y", JsonNull)
                })
            })
        }
        assertEquals("""{"a":"س","b":1,"c":[{"y":null,"z":true}]}""", CanonicalJson.encode(value))
    }

    @Test
    fun escapesStringsLikeJson() {
        val value = buildJsonObject {
            put("text", "سطر\n\"مقتبس\"\t\\")
        }
        assertEquals("""{"text":"سطر\n\"مقتبس\"\t\\"}""", CanonicalJson.encode(value))
    }

    @Test
    fun encodesControlCharactersAsUnicode() {
        val value = buildJsonObject {
            put("text", "a\u0001b")
        }
        assertEquals("""{"text":"a\u0001b"}""", CanonicalJson.encode(value))
    }
}
