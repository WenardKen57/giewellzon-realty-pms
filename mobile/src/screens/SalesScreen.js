import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import FAB from "../components/FAB";
import { listSales, deleteSale } from "../api/sales";
import AddSaleModal from "./modals/AddSaleModal";
import EditSaleModal from "./modals/EditSaleModal";

export default function SalesScreen() {
  const [stats, setStats] = useState({ total: 0, totalRevenue: 0, avgSalePrice: 0 });
  const [rows, setRows] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [edit, setEdit] = useState(null);

  async function load() {
    const r = await listSales();
    setRows(r.data || []);
    setStats({ total: r.total || 0, totalRevenue: r.totalRevenue || 0, avgSalePrice: r.avgSalePrice || 0 });
  }
  useEffect(() => { load(); }, []);

  const confirmDelete = (id) => {
    Alert.alert("Delete Sale", "Are you sure you want to delete this sale?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteSale(id); load(); } }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.light }}>
      <Header title="Sales" />
      <View style={{ padding: 12, backgroundColor: "#f4f4f4" }}>
        <Text style={{ color: colors.muted }}>{stats.total} Total Sales</Text>
      </View >
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Kpi title="Total Sales" value={stats.total} />
          <Kpi title="Total Revenue" value={`₱${Number(stats.totalRevenue).toLocaleString()}`} />
        </View>
        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 12, elevation: 2 }}>
          <Text style={{ fontWeight: "600", marginBottom: 8 }}>Average Sale Price</Text>
          <Text style={{ fontWeight: "700", color: colors.primary, fontSize: 18 }}>₱{Number(stats.avgSalePrice).toLocaleString()}</Text>
        </View>

        <View style={{ gap: 12 }}>
          {rows.map((s) => (
            <View key={s._id} style={{ backgroundColor: colors.white, borderRadius: 12, padding: 12, elevation: 2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontWeight: "700" }}>{s.propertyName}</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable onPress={() => setEdit(s)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.gray }}>
                    <Text>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(s._id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.secondary }}>
                    <Text style={{ color: "#fff" }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
              <View style={{ marginTop: 8, gap: 4 }}>
                <Text>Buyer: {s.buyerName || "-"}</Text>
                <Text>Agent: {s.agentName || "-"}</Text>
                <Text>Date: {(s.saleDate || "").slice(0, 10)}</Text>
                <Text style={{ marginTop: 4, color: colors.primary, fontWeight: "700" }}>₱ {Number(s.salePrice).toLocaleString()}</Text>
              </View>
            </View>
          ))}
          {rows.length === 0 && <Text style={{ color: colors.muted, textAlign: "center" }}>No sales yet.</Text>}
        </View>
      </ScrollView>

      <FAB onPress={() => setOpenAdd(true)} />
      <AddSaleModal open={openAdd} onClose={(reload) => { setOpenAdd(false); if (reload) load(); }} />
      <EditSaleModal sale={edit} onClose={(reload) => { setEdit(null); if (reload) load(); }} />
    </View>
  );
}
function Kpi({ title, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 12, elevation: 2 }}>
      <Text style={{ color: colors.muted }}>{title}</Text>
      <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 18 }}>{value}</Text>
    </View>
  );
}