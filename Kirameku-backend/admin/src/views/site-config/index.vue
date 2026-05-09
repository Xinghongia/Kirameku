<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message as msg } from "@/utils/message";
import {
  getAllSiteConfig,
  updateSiteConfig,
  createSiteConfig,
  deleteSiteConfig
} from "@/api/siteConfig";
import type { SiteConfigItem } from "@/api/siteConfig";

defineOptions({ name: "SiteConfigIndex" });

const loading = ref(false);
const dataList = ref<SiteConfigItem[]>([]);

// 编辑对话框
const dialogVisible = ref(false);
const dialogTitle = ref("编辑配置");
const formRef = ref();
const form = ref({
  key: "",
  value: "",
  description: ""
});
const isEdit = ref(false);

const rules = {
  key: [{ required: true, message: "请输入配置键名", trigger: "blur" }],
  value: [{ required: true, message: "请输入配置值", trigger: "blur" }]
};

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 60 },
  { label: "配置键名", prop: "key", width: 220 },
  {
    label: "配置值",
    prop: "value",
    minWidth: 200,
    slot: "value"
  },
  { label: "说明", prop: "description", minWidth: 160 },
  {
    label: "更新时间",
    prop: "updated_at",
    width: 170,
    formatter: ({ updated_at }: SiteConfigItem) =>
      updated_at ? updated_at.replace("T", " ").slice(0, 19) : ""
  },
  {
    label: "操作",
    fixed: "right",
    width: 150,
    slot: "operation"
  }
];

async function onSearch() {
  loading.value = true;
  try {
    dataList.value = await getAllSiteConfig();
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  isEdit.value = false;
  dialogTitle.value = "新增配置";
  form.value = { key: "", value: "", description: "" };
  dialogVisible.value = true;
}

function openEdit(row: SiteConfigItem) {
  isEdit.value = true;
  dialogTitle.value = "编辑配置";
  form.value = {
    key: row.key,
    value: typeof row.value === "string" ? row.value : JSON.stringify(row.value),
    description: row.description || ""
  };
  dialogVisible.value = true;
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  try {
    if (isEdit.value) {
      await updateSiteConfig(form.value.key, {
        value: form.value.value,
        description: form.value.description
      });
      msg("更新成功", { type: "success" });
    } else {
      await createSiteConfig({
        key: form.value.key,
        value: form.value.value,
        description: form.value.description
      });
      msg("新增成功", { type: "success" });
    }
    dialogVisible.value = false;
    onSearch();
  } catch (e: any) {
    msg(e?.message ?? "操作失败", { type: "error" });
  }
}

async function handleDelete(row: SiteConfigItem) {
  try {
    await deleteSiteConfig(row.key);
    msg("删除成功", { type: "success" });
    onSearch();
  } catch (e: any) {
    msg(e?.message ?? "删除失败", { type: "error" });
  }
}

function formatValue(val: unknown): string {
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

onMounted(() => onSearch());
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-medium">站点配置</span>
          <el-button type="primary" @click="openAdd">新增配置</el-button>
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
        <template #value="{ row }">
          <div class="text-left max-w-xs truncate" :title="formatValue(row.value)">
            {{ formatValue(row.value) }}
          </div>
        </template>

        <template #operation="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">
            编辑
          </el-button>
          <el-popconfirm
            :title="`确认删除配置 ${row.key}？`"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </pure-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="配置键名" prop="key">
          <el-input
            v-model="form.key"
            :disabled="isEdit"
            placeholder="如 cloud_music_playlist_id"
          />
        </el-form-item>
        <el-form-item label="配置值" prop="value">
          <el-input
            v-model="form.value"
            type="textarea"
            :rows="3"
            placeholder="配置值"
          />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input
            v-model="form.description"
            placeholder="配置项说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
