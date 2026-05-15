<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import {
  getBookmarkCategories,
  createBookmarkCategory,
  updateBookmarkCategory,
  deleteBookmarkCategory,
  getBookmarkSites,
  createBookmarkSite,
  updateBookmarkSite,
  deleteBookmarkSite
} from "@/api/bookmark";
import type {
  BookmarkCategoryItem,
  BookmarkSiteItem
} from "@/api/bookmark";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { uploadImage } from "@/api/album";

defineOptions({ name: "BookmarkIndex" });

// ========== 分类列表 ==========
const loading = ref(false);
const dataList = ref<BookmarkCategoryItem[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref("新增分类");
const formRef = ref();
const form = ref({
  id: 0,
  name: "",
  icon: "",
  description: "",
  sort: 0
});

const rules = {
  name: [{ required: true, message: "请输入分类名称", trigger: "blur" }]
};

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 70 },
  {
    label: "图标",
    prop: "icon",
    width: 80,
    slot: "icon"
  },
  { label: "分类名称", prop: "name", minWidth: 150 },
  { label: "描述", prop: "description", minWidth: 200 },
  { label: "排序", prop: "sort", width: 80 },
  {
    label: "创建时间",
    prop: "created_at",
    minWidth: 170,
    formatter: ({ created_at }) =>
      created_at?.replace("T", " ").slice(0, 19) ?? ""
  },
  { label: "操作", fixed: "right", width: 250, slot: "operation" }
];

async function onSearch() {
  loading.value = true;
  try {
    dataList.value = await getBookmarkCategories();
  } finally {
    loading.value = false;
  }
}

function openDialog(title: string, row?: BookmarkCategoryItem) {
  dialogTitle.value = title;
  catUploading.value = false;
  if (row) {
    form.value = {
      id: row.id,
      name: row.name,
      icon: row.icon || "",
      description: row.description || "",
      sort: row.sort ?? 0
    };
  } else {
    form.value = {
      id: 0,
      name: "",
      icon: "",
      description: "",
      sort: dataList.value.length + 1
    };
  }
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  try {
    if (form.value.id) {
      await updateBookmarkCategory(form.value.id, {
        name: form.value.name,
        icon: form.value.icon,
        description: form.value.description,
        sort: form.value.sort
      });
      message("分类更新成功", { type: "success" });
    } else {
      await createBookmarkCategory({
        name: form.value.name,
        icon: form.value.icon,
        description: form.value.description,
        sort: form.value.sort
      });
      message("分类创建成功", { type: "success" });
    }
    dialogVisible.value = false;
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "操作失败", { type: "error" });
  }
}

async function handleDeleteCategory(row: BookmarkCategoryItem) {
  try {
    await deleteBookmarkCategory(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "删除失败", { type: "error" });
  }
}

// ========== 图片上传 ==========
const catUploading = ref(false);
const siteUploading = ref(false);

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

async function handleCatIconUpload(uploadFile: any) {
  const file = uploadFile.raw || uploadFile.file || uploadFile;
  if (!file) return;
  catUploading.value = true;
  try {
    const isSvg = file.type === "image/svg+xml" || file.name.endsWith(".svg");
    const toUpload = isSvg ? file : await compressImage(file);
    const res = await uploadImage(toUpload);
    form.value.icon = res.url;
    message("图标上传成功", { type: "success" });
  } catch (e: any) {
    message(e?.message ?? "上传失败", { type: "error" });
  } finally {
    catUploading.value = false;
  }
}

async function handleSiteIconUpload(uploadFile: any) {
  const file = uploadFile.raw || uploadFile.file || uploadFile;
  if (!file) return;
  siteUploading.value = true;
  try {
    const isSvg = file.type === "image/svg+xml" || file.name.endsWith(".svg");
    const toUpload = isSvg ? file : await compressImage(file);
    const res = await uploadImage(toUpload);
    siteForm.value.icon = res.url;
    message("图标上传成功", { type: "success" });
  } catch (e: any) {
    message(e?.message ?? "上传失败", { type: "error" });
  } finally {
    siteUploading.value = false;
  }
}

// ========== 站点管理 ==========
const drawerVisible = ref(false);
const currentCategory = ref<BookmarkCategoryItem | null>(null);
const sites = ref<BookmarkSiteItem[]>([]);
const sitesLoading = ref(false);

// 站点表单
const siteDialogVisible = ref(false);
const siteDialogTitle = ref("新增站点");
const siteFormRef = ref();
const siteForm = ref({
  id: 0,
  category_id: 0,
  name: "",
  url: "",
  icon: "",
  description: "",
  platforms: [] as string[],
  sort: 0
});
const platformInput = ref("");
const platformOptions = [
  "Windows", "macOS", "Linux",
  "Android", "iOS",
  "Web", "Chrome", "Firefox", "Edge", "Safari",
  "Chrome插件", "油猴脚本",
  "Docker", "命令行"
];

const siteRules = {
  name: [{ required: true, message: "请输入站点名称", trigger: "blur" }],
  url: [{ required: true, message: "请输入站点链接", trigger: "blur" }]
};

const siteColumns: TableColumnList = [
  { label: "ID", prop: "id", width: 60 },
  {
    label: "图标",
    prop: "icon",
    width: 60,
    slot: "siteIcon"
  },
  { label: "名称", prop: "name", minWidth: 120 },
  {
    label: "链接",
    prop: "url",
    minWidth: 180,
    formatter: ({ url }) =>
      url
        ? `<a href="${url}" target="_blank" class="text-blue-500">${url}</a>`
        : "-"
  },
  {
    label: "描述",
    prop: "description",
    minWidth: 150,
    formatter: ({ description }) =>
      description?.length > 30
        ? description.slice(0, 30) + "..."
        : description || "-"
  },
  {
    label: "平台",
    prop: "platforms",
    minWidth: 150,
    slot: "platforms"
  },
  { label: "排序", prop: "sort", width: 70 },
  { label: "操作", fixed: "right", width: 160, slot: "siteOperation" }
];

async function openSites(row: BookmarkCategoryItem) {
  currentCategory.value = row;
  drawerVisible.value = true;
  await loadSites(row.id);
}

async function loadSites(categoryId: number) {
  sitesLoading.value = true;
  try {
    sites.value = await getBookmarkSites(categoryId);
  } finally {
    sitesLoading.value = false;
  }
}

function openSiteDialog(title: string, row?: BookmarkSiteItem) {
  siteDialogTitle.value = title;
  if (row) {
    siteForm.value = {
      id: row.id,
      category_id: row.category_id,
      name: row.name,
      url: row.url,
      icon: row.icon || "",
      description: row.description || "",
      platforms: [...(row.platforms || [])],
      sort: row.sort ?? 0
    };
  } else {
    siteForm.value = {
      id: 0,
      category_id: currentCategory.value?.id ?? 0,
      name: "",
      url: "",
      icon: "",
      description: "",
      platforms: [],
      sort: sites.value.length + 1
    };
  }
  platformInput.value = "";
  siteUploading.value = false;
  siteDialogVisible.value = true;
}

async function handleSiteSubmit() {
  const valid = await siteFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  try {
    const payload = {
      category_id: siteForm.value.category_id,
      name: siteForm.value.name,
      url: siteForm.value.url,
      icon: siteForm.value.icon,
      description: siteForm.value.description,
      platforms: siteForm.value.platforms,
      sort: siteForm.value.sort
    };
    if (siteForm.value.id) {
      await updateBookmarkSite(siteForm.value.id, payload);
      message("站点更新成功", { type: "success" });
    } else {
      await createBookmarkSite(payload);
      message("站点创建成功", { type: "success" });
    }
    siteDialogVisible.value = false;
    if (currentCategory.value) {
      await loadSites(currentCategory.value.id);
    }
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "操作失败", { type: "error" });
  }
}

async function handleDeleteSite(row: BookmarkSiteItem) {
  try {
    await deleteBookmarkSite(row.id);
    message("删除成功", { type: "success" });
    if (currentCategory.value) {
      await loadSites(currentCategory.value.id);
      onSearch();
    }
  } catch (e: any) {
    message(e?.message ?? "删除失败", { type: "error" });
  }
}

onMounted(() => onSearch());
</script>

<template>
  <div class="p-4">
    <!-- 分类列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-medium">收藏夹管理</span>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:add-circle-line')"
            @click="openDialog('新增分类')"
          >
            新增分类
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
        <template #icon="{ row }">
          <el-image
            v-if="row.icon"
            :src="row.icon"
            fit="cover"
            class="w-10 h-10 rounded"
          />
          <span v-else class="text-gray-400 text-xs">无</span>
        </template>

        <template #operation="{ row }">
          <el-button
            link
            type="primary"
            :icon="useRenderIcon('ri:bookmark-line')"
            @click="openSites(row)"
          >
            管理站点
          </el-button>
          <el-button
            link
            type="primary"
            :icon="useRenderIcon('ri:edit-line')"
            @click="openDialog('修改分类', row)"
          >
            修改
          </el-button>
          <el-popconfirm
            :title="`确认删除分类「${row.name}」及其所有站点？`"
            @confirm="handleDeleteCategory(row)"
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

    <!-- 新增/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="flex items-center gap-4 w-full">
            <div
              v-if="form.icon"
              class="relative w-16 h-16 rounded overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0"
            >
              <el-image :src="form.icon" fit="cover" class="w-full h-full" />
              <el-icon
                class="absolute top-0 right-0 bg-black/60 text-white rounded-full cursor-pointer text-xs p-0.5"
                @click="form.icon = ''"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </el-icon>
            </div>
            <div class="flex flex-col gap-2 flex-1">
              <el-upload
                :show-file-list="false"
                :http-request="() => {}"
                :before-upload="() => false"
                :on-change="handleCatIconUpload"
                accept="image/*"
              >
                <el-button :loading="catUploading" type="primary" plain>
                  {{ form.icon ? "更换图标" : "上传图标" }}
                </el-button>
              </el-upload>
              <el-input
                v-model="form.icon"
                placeholder="或直接输入图标 URL"
                clearable
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="分类描述（可选）"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 站点管理抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`管理站点 — ${currentCategory?.name ?? ''}`"
      size="70%"
      destroy-on-close
    >
      <template #header>
        <div class="flex justify-between items-center w-full pr-4">
          <span class="text-lg font-medium">
            管理站点 — {{ currentCategory?.name ?? "" }}
          </span>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:add-circle-line')"
            @click="openSiteDialog('新增站点')"
          >
            新增站点
          </el-button>
        </div>
      </template>

      <div v-loading="sitesLoading">
        <el-empty v-if="!sites.length && !sitesLoading" description="暂无站点" />
        <pure-table
          v-else
          :data="sites"
          :columns="siteColumns"
          :loading="sitesLoading"
          align-whole="center"
          row-key="id"
          table-layout="auto"
        >
          <template #siteIcon="{ row }">
            <el-image
              v-if="row.icon"
              :src="row.icon"
              fit="cover"
              class="w-8 h-8 rounded"
            />
            <span v-else class="text-gray-400 text-xs">无</span>
          </template>

          <template #platforms="{ row }">
            <div class="flex flex-wrap gap-1">
              <el-tag
                v-for="(p, i) in row.platforms || []"
                :key="i"
                size="small"
                type="info"
              >
                {{ p }}
              </el-tag>
              <span
                v-if="!row.platforms?.length"
                class="text-gray-400 text-xs"
              >
                无
              </span>
            </div>
          </template>

          <template #siteOperation="{ row }">
            <el-button
              link
              type="primary"
              :icon="useRenderIcon('ri:edit-line')"
              @click="openSiteDialog('修改站点', row)"
            >
              修改
            </el-button>
            <el-popconfirm
              :title="`确认删除站点「${row.name}」？`"
              @confirm="handleDeleteSite(row)"
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
      </div>
    </el-drawer>

    <!-- 新增/编辑站点对话框 -->
    <el-dialog
      v-model="siteDialogVisible"
      :title="siteDialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="siteFormRef"
        :model="siteForm"
        :rules="siteRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="siteForm.name" placeholder="站点名称" />
        </el-form-item>
        <el-form-item label="链接" prop="url">
          <el-input v-model="siteForm.url" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="flex items-center gap-4 w-full">
            <div
              v-if="siteForm.icon"
              class="relative w-16 h-16 rounded overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0"
            >
              <el-image :src="siteForm.icon" fit="cover" class="w-full h-full" />
              <el-icon
                class="absolute top-0 right-0 bg-black/60 text-white rounded-full cursor-pointer text-xs p-0.5"
                @click="siteForm.icon = ''"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </el-icon>
            </div>
            <div class="flex flex-col gap-2 flex-1">
              <el-upload
                :show-file-list="false"
                :http-request="() => {}"
                :before-upload="() => false"
                :on-change="handleSiteIconUpload"
                accept="image/*"
              >
                <el-button :loading="siteUploading" type="primary" plain>
                  {{ siteForm.icon ? "更换图标" : "上传图标" }}
                </el-button>
              </el-upload>
              <el-input
                v-model="siteForm.icon"
                placeholder="或直接输入图标 URL"
                clearable
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="siteForm.description"
            type="textarea"
            :rows="2"
            placeholder="简短描述（可选）"
          />
        </el-form-item>
        <el-form-item label="平台">
          <el-select
            v-model="siteForm.platforms"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择平台（可自定义输入）"
            class="w-full"
          >
            <el-option
              v-for="item in platformOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="siteForm.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="siteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSiteSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
