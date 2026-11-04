package com.malines.app.ui

import android.content.Context
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malines.app.data.AppViewModel
import com.malines.app.data.SarSnapshot

private val kindLabels = mapOf(
    "military" to "عسكري",
    "economic" to "اقتصادي",
    "diplomatic" to "دبلوماسي",
    "internal" to "داخلي",
)

@Composable
private fun SectionCard(title: String, content: @Composable () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, color = MalinesGold, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
            content()
        }
    }
}

@Composable
private fun KeyValue(key: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(key, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
        Text(value, color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp)
    }
}

@Composable
fun StateScreen(snapshot: SarSnapshot?) {
    if (snapshot == null) {
        EmptyState("لا توجد بيانات — حدّث أو استورد SAR.json")
        return
    }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        items(snapshot.states) { state ->
            SectionCard(title = state.nameAr.ifEmpty { state.name }) {
                KeyValue("النظام السياسي", state.politicalSystem)
                KeyValue("الخزينة", "%.0f".format(state.treasury))
                KeyValue("الصناعة", "%.0f".format(state.industry))
                KeyValue("الزراعة", "%.0f".format(state.agriculture))
                KeyValue("الاستقرار", "%.0f".format(state.stability))
                if (state.isNpc) Text("دولة غير مُدارة", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
            }
        }
    }
}

@Composable
fun ArmyScreen(snapshot: SarSnapshot?) {
    if (snapshot == null) {
        EmptyState("لا توجد وحدات")
        return
    }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        items(snapshot.units) { unit ->
            SectionCard(title = unit.name.ifEmpty { unit.id }) {
                KeyValue("النوع", unit.kind)
                KeyValue("القوة", unit.strength.toString())
                KeyValue("المعنويات", "%.0f".format(unit.morale))
                KeyValue("الإمداد", "%.0f%%".format(unit.supply * 100))
                KeyValue("التدريب", "%.0f".format(unit.training))
                unit.commander?.let { KeyValue("القائد", it) }
            }
        }
    }
}

@Composable
fun EconomyScreen(snapshot: SarSnapshot?) {
    if (snapshot == null) {
        EmptyState("لا توجد بيانات اقتصادية")
        return
    }
    val names = snapshot.states.associate { it.id to it.nameAr.ifEmpty { it.name } }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        items(snapshot.economy) { row ->
            SectionCard(title = names[row.stateId] ?: row.stateId) {
                KeyValue("الخزينة", "%.0f".format(row.treasury))
                KeyValue("الصناعة", "%.0f".format(row.industry))
                KeyValue("الزراعة", "%.0f".format(row.agriculture))
                KeyValue("الاستقرار", "%.0f".format(row.stability))
                KeyValue("الشرعية", "%.0f".format(row.legitimacy))
            }
        }
    }
}

@Composable
fun DiplomacyScreen(snapshot: SarSnapshot?) {
    if (snapshot == null) {
        EmptyState("لا توجد بيانات دبلوماسية")
        return
    }
    val names = snapshot.states.associate { it.id to it.nameAr.ifEmpty { it.name } }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            SectionCard(title = "الذاكرة الجمعية") {
                if (snapshot.memory.isEmpty()) {
                    Text("لا سوابق مسجّلة بعد", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    snapshot.memory.take(40).forEach { memory ->
                        Text(
                            "${names[memory.stateId] ?: memory.stateId} ← ${names[memory.targetId] ?: memory.targetId}",
                            color = MalinesPaper,
                            fontSize = 12.sp,
                        )
                        Text(
                            "${memory.note ?: memory.kind} (${"%.0f".format(memory.weight)})",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 11.sp,
                        )
                        Spacer(Modifier.height(4.dp))
                    }
                }
            }
        }
        item {
            SectionCard(title = "المعاهدات") {
                Text(
                    "المعاهدات النصّية وتحرير بنودها يأتي في تحديث لاحق. حالياً تُدار عبر لوحة الإدارة.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
fun DecisionsScreen(viewModel: AppViewModel) {
    var kind by remember { mutableStateOf("military") }
    var action by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            SectionCard(title = "قرار جديد") {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { expanded = true }) {
                        Text(kindLabels[kind] ?: kind)
                    }
                    DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        kindLabels.forEach { (value, label) ->
                            DropdownMenuItem(
                                text = { Text(label) },
                                onClick = {
                                    kind = value
                                    expanded = false
                                },
                            )
                        }
                    }
                }
                OutlinedTextField(
                    value = action,
                    onValueChange = { action = it },
                    label = { Text("نص القرار (مثال: fortify_damascus)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            if (action.isNotBlank()) {
                                viewModel.addLocalDecision(kind, action.trim())
                                action = ""
                            }
                        },
                        enabled = action.isNotBlank(),
                    ) { Text("إضافة") }
                    OutlinedButton(onClick = { viewModel.sendAllLive() }) { Text("إرسال المعلّقة") }
                }
            }
        }

        item {
            Text(
                "الملغاة محلياً (${viewModel.localDecisions.size})",
                color = MalinesGold,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        items(viewModel.localDecisions) { decision ->
            SectionCard(title = kindLabels[decision.kind] ?: decision.kind) {
                Text(decision.action, color = MalinesPaper, fontSize = 13.sp)
                Text(decision.gameTime, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
            }
        }

        item {
            SectionCard(title = "كيف تعمل؟") {
                Text(
                    "مع الاتصال: تُرسل القرارات مباشرة للسيرفر. بلا اتصال: تبقى محلية وتُصدَّر من الإعدادات كملف nDSV.json لترفعها الإدارة.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
fun NewsScreen(snapshot: SarSnapshot?) {
    if (snapshot == null) {
        EmptyState("لا توجد أخبار")
        return
    }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        items(snapshot.events) { event ->
            SectionCard(title = event.kind) {
                Text(event.gameTime, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                event.payload?.let {
                    Text(it.toString(), color = MalinesPaper, fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
fun SettingsScreen(viewModel: AppViewModel) {
    val context = LocalContext.current
    var url by remember { mutableStateOf(viewModel.baseUrl) }

    val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val text = readText(context, uri)
            if (text != null) viewModel.importSar(text)
        }
    }
    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if (uri != null) {
            val text = viewModel.ndsvJson()
            if (text != null) {
                context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(text) }
                viewModel.message = "تم تصدير nDSV.json"
            } else {
                viewModel.message = "لا توجد بيانات للتصدير"
            }
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            SectionCard(title = "السيرفر") {
                OutlinedTextField(
                    value = url,
                    onValueChange = { url = it },
                    label = { Text("عنوان السيرفر") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = {
                        viewModel.updateServerUrl(url)
                        viewModel.refresh()
                    }) { Text("حفظ وتحديث") }
                    OutlinedButton(onClick = { viewModel.refresh() }) { Text("تحديث") }
                }
            }
        }

        item {
            SectionCard(title = "ملفات اللعب") {
                Button(
                    onClick = { importLauncher.launch(arrayOf("application/json", "text/plain", "*/*")) },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("استيراد SAR.json") }
                Spacer(Modifier.height(6.dp))
                OutlinedButton(
                    onClick = { exportLauncher.launch("nDSV.json") },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("تصدير nDSV.json") }
                Spacer(Modifier.height(6.dp))
                Text(
                    "الملف المصدَّر يحتوي القرارات المحلية. التوقيع الرقمي للتطبيق يُضاف في تحديث لاحق.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        item {
            SectionCard(title = "حالة البيانات") {
                val snapshot = viewModel.snapshot
                KeyValue("النسخة", "1.1.0.13-beta")
                KeyValue("زمن اللعبة", snapshot?.time?.gameTime ?: "—")
                KeyValue("المقاطعات المحمّلة", viewModel.polygons.size.toString())
                KeyValue("الدول", snapshot?.states?.size?.toString() ?: "—")
                KeyValue("الوحدات", snapshot?.units?.size?.toString() ?: "—")
                KeyValue("بصمة اللقطة", snapshot?.meta?.snapshotId ?: "—")
            }
        }
    }
}

@Composable
private fun EmptyState(text: String) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

private fun readText(context: Context, uri: android.net.Uri): String? = runCatching {
    context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
}.getOrNull()
