<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import { getVisitors, deleteVisitor, clearVisitors } from "@/api/visitor";
import type { VisitorItem } from "@/api/visitor";

defineOptions({ name: "VisitorIndex" });

const loading = ref(false);
const dataList = ref<VisitorItem[]>([]);

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 60 },
  { label: "IP", prop: "ip", width: 140 },
  { label: "位置", prop: "location", minWidth: 160, slot: "location" },
  { label: "运营商", prop: "org", minWidth: 120 },
  { label: "浏览器", prop: "browser", width: 90 },
  { label: "系统", prop: "os", width: 90 },
  { label: "设备", prop: "device_type", width: 70 },
  { label: "访问页面", prop: "path", minWidth: 160 },
  {
    label: "访问时间",
    prop: "created_at",
    minWidth: 160,
    formatter: ({ created_at }) =>
      created_at ? created_at.replace("T", " ").slice(0, 19) : ""
  },
  {
    label: "操作",
    fixed: "right",
    width: 120,
    slot: "operation"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    const res = await getVisitors({ size: 100 });
    dataList.value = res.data ?? [];
  } finally {
    loading.value = false;
  }
}

async function handleDelete(row: VisitorItem) {
  try {
    await deleteVisitor(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "删除失败", { type: "error" });
  }
}

async function handleClear() {
  try {
    await clearVisitors();
    message("已清空", { type: "success" });
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "清空失败", { type: "error" });
  }
}

onMounted(() => onSearch());
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-medium">访客记录</span>
          <el-popconfirm title="确认清空所有访客记录？" @confirm="handleClear">
            <template #reference>
              <el-button type="danger" size="small">清空</el-button>
            </template>
          </el-popconfirm>
        </div>
      </template>

      <pure-table
        :data="dataList"
        :columns="columns"
        :loading="loading"
        align-whole="center"
        row-key="id"
        table-layout="auto"
      >
        <template #location="{ row }">
          <span class="text-sm">
            {{
              [row.city, row.region, row.country].filter(Boolean).join(", ") ||
              "未知"
            }}
          </span>
        </template>

        <template #operation="{ row }">
          <el-popconfirm
            title="确认删除这条记录？"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </pure-table>
    </el-card>
  </div>
</template>
