<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import {
  getFriendLinks,
  createFriendLink,
  updateFriendLink,
  deleteFriendLink,
  uploadImage
} from "@/api/friend-link";
import type { FriendLinkItem } from "@/api/friend-link";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { UploadRequestHandler } from "element-plus";

defineOptions({ name: "FriendLinkIndex" });

const skipAutoUpload: UploadRequestHandler = () => Promise.resolve();

// ========== 列表 ==========
const loading = ref(false);
const dataList = ref<FriendLinkItem[]>([]);

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 70 },
  {
    label: "头像",
    prop: "avatar",
    width: 80,
    slot: "avatar"
  },
  { label: "名称", prop: "name", minWidth: 120 },
  {
    label: "链接",
    prop: "url",
    minWidth: 200,
    formatter: ({ url }) =>
      url
        ? `<a href="${url}" target="_blank" class="text-blue-500">${url}</a>`
        : "-"
  },
  {
    label: "描述",
    prop: "description",
    minWidth: 180,
    formatter: ({ description }) =>
      description?.length > 50
        ? description.slice(0, 50) + "..."
        : description || "-"
  },
  { label: "排序", prop: "sort", width: 80 },
  {
    label: "状态",
    prop: "is_approved",
    width: 90,
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "created_at",
    minWidth: 170,
    formatter: ({ created_at }) =>
      created_at?.replace("T", " ").slice(0, 19) ?? ""
  },
  {
    label: "修改时间",
    prop: "updated_at",
    minWidth: 170,
    formatter: ({ updated_at }) =>
      updated_at?.replace("T", " ").slice(0, 19) ?? ""
  },
  { label: "操作", fixed: "right", width: 200, slot: "operation" }
];

async function onSearch() {
  loading.value = true;
  try {
    dataList.value = await getFriendLinks();
  } finally {
    loading.value = false;
  }
}

// ========== 新增/编辑 ==========
const dialogVisible = ref(false);
const dialogTitle = ref("新增友链");
const formRef = ref();
const form = ref({
  id: 0,
  name: "",
  url: "",
  avatar: "",
  description: "",
  sort: 0,
  is_approved: true
});

const rules = {
  name: [{ required: true, message: "请输入友链名称", trigger: "blur" }],
  url: [{ required: true, message: "请输入链接地址", trigger: "blur" }]
};

function openDialog(title: string, row?: FriendLinkItem) {
  dialogTitle.value = title;
  if (row) {
    form.value = {
      id: row.id,
      name: row.name,
      url: row.url,
      avatar: row.avatar || "",
      description: row.description || "",
      sort: row.sort ?? 0,
      is_approved: row.is_approved
    };
  } else {
    form.value = {
      id: 0,
      name: "",
      url: "",
      avatar: "",
      description: "",
      sort: 0,
      is_approved: true
    };
  }
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  try {
    const payload = {
      name: form.value.name,
      url: form.value.url,
      avatar: form.value.avatar,
      description: form.value.description,
      sort: form.value.sort,
      is_approved: form.value.is_approved
    };
    if (form.value.id) {
      await updateFriendLink(form.value.id, payload);
      message("友链更新成功", { type: "success" });
    } else {
      await createFriendLink(payload);
      message("友链创建成功", { type: "success" });
    }
    dialogVisible.value = false;
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "操作失败", { type: "error" });
  }
}

async function handleDelete(row: FriendLinkItem) {
  try {
    await deleteFriendLink(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "删除失败", { type: "error" });
  }
}

async function handleToggleApproved(row: FriendLinkItem) {
  try {
    await updateFriendLink(row.id, { is_approved: !row.is_approved });
    message(row.is_approved ? "已取消审核" : "已通过审核", { type: "success" });
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "操作失败", { type: "error" });
  }
}

// ========== 头像上传 ==========
const uploading = ref(false);

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          blob => {
            if (!blob) return resolve(file);
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.8
        );
      };
      img.onerror = () => resolve(file);
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function handleAvatarUpload(uploadFile: any) {
  const file = uploadFile.raw || uploadFile.file || uploadFile;
  if (!file) return;
  uploading.value = true;
  try {
    const compressed = await compressImage(file);
    const res = await uploadImage(compressed);
    form.value.avatar = res.url;
    message("头像上传成功", { type: "success" });
  } catch (e: any) {
    message(e?.message ?? "上传失败", { type: "error" });
  } finally {
    uploading.value = false;
  }
}

onMounted(() => onSearch());
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-medium">友链管理</span>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:add-circle-line')"
            @click="openDialog('新增友链')"
          >
            新增友链
          </el-button>
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
        <template #avatar="{ row }">
          <el-image
            v-if="row.avatar"
            :src="row.avatar"
            fit="cover"
            preview-teleported
            class="w-10 h-10 rounded-full"
          />
          <span v-else class="text-gray-400 text-xs">无</span>
        </template>

        <template #status="{ row }">
          <el-tag
            :type="row.is_approved ? 'success' : 'warning'"
            size="small"
            class="cursor-pointer"
            @click="handleToggleApproved(row)"
          >
            {{ row.is_approved ? "已审核" : "待审核" }}
          </el-tag>
        </template>

        <template #operation="{ row }">
          <el-button
            link
            type="primary"
            :icon="useRenderIcon('ri:edit-line')"
            @click="openDialog('修改友链', row)"
          >
            修改
          </el-button>
          <el-popconfirm
            :title="`确认删除友链「${row.name}」？`"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button
                link
                type="danger"
                :icon="useRenderIcon('ri:delete-bin-line')"
              >
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </pure-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="友链名称" />
        </el-form-item>
        <el-form-item label="链接" prop="url">
          <el-input v-model="form.url" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="头像">
          <div class="flex items-center gap-4">
            <div
              v-if="form.avatar"
              class="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0"
            >
              <el-image :src="form.avatar" fit="cover" class="w-full h-full" />
              <el-icon
                class="absolute top-0 right-0 bg-black/60 text-white rounded-full cursor-pointer text-xs p-0.5"
                @click="form.avatar = ''"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </el-icon>
            </div>
            <el-upload
              :show-file-list="false"
              :http-request="skipAutoUpload"
              :before-upload="() => false"
              :on-change="handleAvatarUpload"
              accept="image/*"
            >
              <el-button :loading="uploading" type="primary" plain>
                {{ form.avatar ? "更换" : "上传头像" }}
              </el-button>
            </el-upload>
          </div>
          <el-input
            v-model="form.avatar"
            placeholder="或直接输入头像链接 https://..."
            class="mt-2"
            clearable
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="简短描述..."
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="审核">
          <el-switch
            v-model="form.is_approved"
            active-text="通过"
            inactive-text="待审核"
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
