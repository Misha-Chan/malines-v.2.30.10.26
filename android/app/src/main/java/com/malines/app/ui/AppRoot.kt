package com.malines.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Handshake
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Newspaper
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.malines.app.data.AppViewModel
import kotlinx.coroutines.launch

enum class Destination(val label: String, val icon: ImageVector) {
    Map("الخريطة", Icons.Default.Map),
    State("الدولة", Icons.Default.AccountBalance),
    Army("الجيش", Icons.Default.Shield),
    Economy("الاقتصاد", Icons.Default.AttachMoney),
    Diplomacy("الدبلوماسية", Icons.Default.Handshake),
    Decisions("القرارات", Icons.Default.Gavel),
    News("الأخبار", Icons.Default.Newspaper),
    Settings("الإعدادات", Icons.Default.Settings),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppRoot(viewModel: AppViewModel = viewModel()) {
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var current by remember { mutableStateOf(Destination.Map) }
    val snapshot = viewModel.snapshot

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("مالينز", color = MalinesGold, fontWeight = FontWeight.Bold, fontSize = 24.sp)
                    Text("1.1.0.13-beta", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    Spacer(Modifier.height(10.dp))
                    Text(
                        snapshot?.time?.gameTime ?: "لا بيانات",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp,
                    )
                }
                Destination.entries.forEach { destination ->
                    NavigationDrawerItem(
                        label = { Text(destination.label) },
                        icon = { Icon(destination.icon, contentDescription = null) },
                        selected = destination == current,
                        onClick = {
                            current = destination
                            scope.launch { drawerState.close() }
                        },
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 2.dp),
                    )
                }
            }
        },
    ) {
        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                TopAppBar(
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background,
                        titleContentColor = MalinesPaper,
                    ),
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "القائمة")
                        }
                    },
                    title = {
                        Column {
                            Text(current.label, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                            Text(
                                snapshot?.time?.gameTime ?: "غير متصل",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 11.sp,
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = { viewModel.refresh() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "تحديث")
                        }
                    },
                )
            },
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                if (viewModel.loading) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
                viewModel.message?.let { message ->
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.message = null },
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(message, fontSize = 12.sp, color = MalinesPaper)
                            Text("إخفاء", fontSize = 11.sp, color = MalinesGold)
                        }
                    }
                }

                when (current) {
                    Destination.Map -> MapPanel(
                        polygons = viewModel.polygons,
                        states = snapshot?.states ?: emptyList(),
                        modifier = Modifier.fillMaxSize(),
                        onSelected = { },
                    )
                    Destination.State -> StateScreen(snapshot)
                    Destination.Army -> ArmyScreen(snapshot)
                    Destination.Economy -> EconomyScreen(snapshot)
                    Destination.Diplomacy -> DiplomacyScreen(snapshot)
                    Destination.Decisions -> DecisionsScreen(viewModel)
                    Destination.News -> NewsScreen(snapshot)
                    Destination.Settings -> SettingsScreen(viewModel)
                }
            }
        }
    }
}
