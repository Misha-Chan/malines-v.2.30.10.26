package com.malines.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CenterFocusStrong
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malines.app.data.MapPolygon
import com.malines.app.data.StateRow
import kotlin.math.min

private class MapTransform {
    var zoom by mutableFloatStateOf(1f)
    var pan by mutableStateOf(Offset.Zero)
}

private class MapBounds(
    val minLon: Double,
    val maxLon: Double,
    val minLat: Double,
    val maxLat: Double,
) {
    val width: Double get() = (maxLon - minLon).coerceAtLeast(0.0001)
    val height: Double get() = (maxLat - minLat).coerceAtLeast(0.0001)
}

private fun boundsOf(polygons: List<MapPolygon>): MapBounds? {
    if (polygons.isEmpty()) return null
    var minLon = Double.MAX_VALUE
    var maxLon = -Double.MAX_VALUE
    var minLat = Double.MAX_VALUE
    var maxLat = -Double.MAX_VALUE
    for (polygon in polygons) {
        for ((lon, lat) in polygon.points) {
            if (lon < minLon) minLon = lon
            if (lon > maxLon) maxLon = lon
            if (lat < minLat) minLat = lat
            if (lat > maxLat) maxLat = lat
        }
    }
    return MapBounds(minLon, maxLon, minLat, maxLat)
}

private fun contains(points: List<Pair<Double, Double>>, x: Double, y: Double): Boolean {
    var inside = false
    var j = points.lastIndex
    for (i in points.indices) {
        val xi = points[i].first
        val yi = points[i].second
        val xj = points[j].first
        val yj = points[j].second
        if (((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside
        j = i
    }
    return inside
}

private fun parseColor(hex: String): Color = runCatching {
    Color(android.graphics.Color.parseColor(hex))
}.getOrDefault(MalinesRed)

@Composable
fun MapPanel(
    polygons: List<MapPolygon>,
    states: List<StateRow>,
    modifier: Modifier = Modifier,
    onSelected: (MapPolygon?) -> Unit,
) {
    val ownerColors = remember(states) { states.associate { it.id to parseColor(it.color) } }
    val bounds = remember(polygons) { boundsOf(polygons) }
    val transform = remember { MapTransform() }
    var size by remember { mutableStateOf(IntSize.Zero) }
    var selectedId by remember { mutableStateOf<String?>(null) }
    val textMeasurer = rememberTextMeasurer()

    val transformState = rememberTransformableState { zoomChange, panChange, _ ->
        transform.zoom = (transform.zoom * zoomChange).coerceIn(0.7f, 14f)
        transform.pan += panChange
    }

    Box(modifier = modifier.background(Color(0xFF070B10))) {
        if (bounds == null || size.width == 0) {
            Text(
                text = "لا توجد خريطة محمّلة",
                color = MalinesPaper,
                modifier = Modifier.align(Alignment.Center),
            )
        } else {
        val baseScale = min(size.width / bounds.width, size.height / bounds.height).toFloat() * 0.92f

        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .onSizeChanged { size = it }
                .transformable(transformState)
                .pointerInput(polygons, size, baseScale) {
                    detectTapGestures { position ->
                        val scale = baseScale * transform.zoom
                        val offsetX = transform.pan.x + (size.width - bounds.width.toFloat() * scale) / 2f
                        val offsetY = transform.pan.y + (size.height - bounds.height.toFloat() * scale) / 2f
                        val lon = (position.x - offsetX) / scale + bounds.minLon
                        val lat = bounds.maxLat - (position.y - offsetY) / scale
                        val hit = polygons.lastOrNull { !it.isSea && contains(it.points, lon, lat) }
                        selectedId = hit?.id
                        onSelected(hit)
                    }
                },
        ) {
            val scale = baseScale * transform.zoom
            val offsetX = transform.pan.x + (size.width - bounds.width.toFloat() * scale) / 2f
            val offsetY = transform.pan.y + (size.height - bounds.height.toFloat() * scale) / 2f

            fun x(lon: Double) = ((lon - bounds.minLon) * scale + offsetX).toFloat()
            fun y(lat: Double) = ((bounds.maxLat - lat) * scale + offsetY).toFloat()

            for (polygon in polygons) {
                if (!polygon.isSea) continue
                val path = Path()
                polygon.points.forEachIndexed { index, (lon, lat) ->
                    if (index == 0) path.moveTo(x(lon), y(lat)) else path.lineTo(x(lon), y(lat))
                }
                path.close()
                drawPath(path, Color(0xFF0B1A2B), style = Fill)
                drawPath(path, Color(0xFF1F3B57), style = Stroke(width = 1f))
            }

            for (polygon in polygons) {
                if (polygon.isSea) continue
                val path = Path()
                polygon.points.forEachIndexed { index, (lon, lat) ->
                    if (index == 0) path.moveTo(x(lon), y(lat)) else path.lineTo(x(lon), y(lat))
                }
                path.close()

                val isSelected = polygon.id == selectedId
                val fill = ownerColors[polygon.ownerId] ?: Color(0xFF2F2F2F)
                drawPath(path, fill.copy(alpha = if (isSelected) 0.85f else 0.55f), style = Fill)
                if (isSelected) {
                    drawPath(path, Color(0x55C0392B), style = Fill)
                    drawPath(path, MalinesRed, style = Stroke(width = 3f))
                } else {
                    drawPath(path, MalinesGold.copy(alpha = 0.45f), style = Stroke(width = 1f))
                }

                if (polygon.nameAr.isNotEmpty() && (transform.zoom > 1.2f || polygon.population > 150_000)) {
                    val centroid = polygon.points.fold(0.0 to 0.0) { acc, point ->
                        acc.first + point.first to acc.second + point.second
                    }
                    val cx = x(centroid.first / polygon.points.size)
                    val cy = y(centroid.second / polygon.points.size)
                    val layout = textMeasurer.measure(
                        text = polygon.nameAr,
                        style = TextStyle(color = Color.White.copy(alpha = 0.9f), fontSize = 11.sp),
                    )
                    drawText(
                        textLayoutResult = layout,
                        topLeft = Offset(cx - layout.size.width / 2f, cy - layout.size.height / 2f),
                    )
                }
            }
        }

        Column(
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
            verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp),
        ) {
            MapButton(icon = { Icon(Icons.Default.Add, contentDescription = "تكبير") }) {
                transform.zoom = (transform.zoom * 1.35f).coerceAtMost(14f)
            }
            MapButton(icon = { Icon(Icons.Default.Remove, contentDescription = "تصغير") }) {
                transform.zoom = (transform.zoom / 1.35f).coerceAtLeast(0.7f)
            }
            MapButton(icon = { Icon(Icons.Default.CenterFocusStrong, contentDescription = "إعادة الضبط") }) {
                transform.zoom = 1f
                transform.pan = Offset.Zero
                selectedId = null
                onSelected(null)
            }
        }

        val selected = polygons.firstOrNull { it.id == selectedId }
        if (selected != null) {
            Surface(
                modifier = Modifier.align(Alignment.TopStart).padding(12.dp),
                shape = RoundedCornerShape(12.dp),
                color = Color(0xE60D0D0D),
                tonalElevation = 4.dp,
            ) {
                Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                    Text(selected.nameAr, color = MalinesGold, style = MaterialTheme.typography.titleMedium)
                    if (!selected.isSea) {
                        Text("السكان: ${selected.population}", color = MalinesPaper, fontSize = 12.sp)
                        Text("المالك: ${states.firstOrNull { it.id == selected.ownerId }?.nameAr ?: "—"}", color = MalinesPaper, fontSize = 12.sp)
                    } else {
                        Text("مقاطعة بحرية", color = MalinesPaper, fontSize = 12.sp)
                    }
                }
            }
        }
        }
    }
}

@Composable
private fun MapButton(icon: @Composable () -> Unit, onClick: () -> Unit) {
    FilledTonalIconButton(
        onClick = onClick,
        modifier = Modifier.size(44.dp),
        shape = RoundedCornerShape(12.dp),
    ) { icon() }
}
