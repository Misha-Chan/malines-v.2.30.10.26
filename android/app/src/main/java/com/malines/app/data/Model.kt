package com.malines.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class SarMeta(
    val format: String = "",
    val version: String = "",
    @SerialName("snapshotId") val snapshotId: String = "",
    val createdAt: String = "",
    val gameTime: String = "",
    val keyId: String = "",
    val signature: String = "",
)

@Serializable
data class SarTime(
    val gameTime: String = "",
    val realStartedAt: Long = 0,
    val tickMinutes: Int = 30,
    val ratio: Int = 180,
)

@Serializable
data class Region(
    val id: Int = 0,
    val name: String = "",
    @SerialName("name_ar") val nameAr: String = "",
)

@Serializable
data class Province(
    val id: String = "",
    @SerialName("region_id") val regionId: Int = 0,
    @SerialName("owner_id") val ownerId: String? = null,
    @SerialName("controller_id") val controllerId: String? = null,
    val name: String = "",
    @SerialName("name_ar") val nameAr: String = "",
    @SerialName("is_sea") val isSea: Boolean = false,
    val terrain: String = "",
    val climate: String = "",
    val population: Int = 0,
    val loyalty: Double = 0.0,
    val unrest: Double = 0.0,
    @SerialName("area_km2") val areaKm2: Double = 0.0,
    val geometry: JsonElement? = null,
    val neighbors: List<String> = emptyList(),
    val resources: List<String> = emptyList(),
    val garrison: Int = 0,
    val contested: Boolean = false,
)

@Serializable
data class Settlement(
    val id: String = "",
    @SerialName("province_id") val provinceId: String = "",
    val name: String = "",
    @SerialName("name_ar") val nameAr: String = "",
    val kind: String = "",
    val population: Int = 0,
    val loyalty: Double = 0.0,
    val garrison: Int = 0,
    val problems: List<String> = emptyList(),
)

@Serializable
data class StateRow(
    val id: String = "",
    val name: String = "",
    @SerialName("name_ar") val nameAr: String = "",
    @SerialName("political_system") val politicalSystem: String = "",
    val color: String = "#c0392b",
    val treasury: Double = 0.0,
    val industry: Double = 0.0,
    val agriculture: Double = 0.0,
    val stability: Double = 0.0,
    val legitimacy: Double = 0.0,
    @SerialName("is_npc") val isNpc: Boolean = false,
)

@Serializable
data class UnitRow(
    val id: String = "",
    @SerialName("state_id") val stateId: String = "",
    @SerialName("province_id") val provinceId: String = "",
    val name: String = "",
    val kind: String = "",
    val strength: Int = 0,
    val morale: Double = 0.0,
    val supply: Double = 0.0,
    val training: Double = 0.0,
    val experience: Double = 0.0,
    val commander: String? = null,
    val demographics: JsonElement? = null,
)

@Serializable
data class EconomyRow(
    @SerialName("state_id") val stateId: String = "",
    val treasury: Double = 0.0,
    val industry: Double = 0.0,
    val agriculture: Double = 0.0,
    val stability: Double = 0.0,
    val legitimacy: Double = 0.0,
)

@Serializable
data class PlayerRow(
    val id: String = "",
    val handle: String = "",
    @SerialName("state_id") val stateId: String? = null,
    val role: String = "",
)

@Serializable
data class LeaderRow(
    val id: String = "",
    @SerialName("state_id") val stateId: String? = null,
    val name: String = "",
    val title: String? = null,
    val born: String? = null,
)

@Serializable
data class EventRow(
    val id: String = "",
    @SerialName("game_time") val gameTime: String = "",
    val kind: String = "",
    val payload: JsonElement? = null,
)

@Serializable
data class MemoryRow(
    val id: String = "",
    @SerialName("state_id") val stateId: String = "",
    @SerialName("target_id") val targetId: String = "",
    val kind: String = "",
    val weight: Double = 0.0,
    val note: String? = null,
    @SerialName("game_time") val gameTime: String = "",
)

@Serializable
data class World(
    @SerialName("regionCount") val regionCount: Int = 0,
    @SerialName("provinceCount") val provinceCount: Int = 0,
    @SerialName("seaProvinceCount") val seaProvinceCount: Int = 0,
    val regions: List<Region> = emptyList(),
    val provinces: List<Province> = emptyList(),
    val settlements: List<Settlement> = emptyList(),
)

@Serializable
data class SarSnapshot(
    val meta: SarMeta = SarMeta(),
    val time: SarTime = SarTime(),
    val world: World = World(),
    val states: List<StateRow> = emptyList(),
    val units: List<UnitRow> = emptyList(),
    val economy: List<EconomyRow> = emptyList(),
    val players: List<PlayerRow> = emptyList(),
    val leaders: List<LeaderRow> = emptyList(),
    val events: List<EventRow> = emptyList(),
    val memory: List<MemoryRow> = emptyList(),
)

/** One province polygon extracted from the bundled GeoJSON. */
data class MapPolygon(
    val id: String,
    val nameAr: String,
    val ownerId: String?,
    val isSea: Boolean,
    val population: Int,
    val points: List<Pair<Double, Double>>,
)
