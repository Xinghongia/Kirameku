<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject
} from "@/api/project";
import type { ProjectItem } from "@/api/project";
import { http } from "@/utils/http";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

defineOptions({ name: "ProjectIndex" });

const loading = ref(false);
const dataList = ref<ProjectItem[]>([]);

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 60 },
  {
    label: "封面",
    prop: "cover_image",
    width: 80,
    slot: "cover"
  },
  { label: "名称", prop: "name", minWidth: 120 },
  { label: "Slug", prop: "slug", width: 120 },
  {
    label: "描述",
    prop: "description",
    minWidth: 200,
    formatter: ({ description }: ProjectItem) =>
      description?.length > 60
        ? description.slice(0, 60) + "..."
        : description || "-"
  },
  {
    label: "技术栈",
    prop: "tech_stack",
    width: 150,
    slot: "tech"
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    slot: "status"
  },
  { label: "精选", prop: "is_featured", width: 70, slot: "featured" },
  { label: "排序", prop: "sort", width: 70 },
  {
    label: "创建时间",
    prop: "created_at",
    width: 170,
    formatter: ({ created_at }: ProjectItem) =>
      created_at?.replace("T", " ").slice(0, 19) ?? ""
  },
  { label: "操作", fixed: "right", width: 200, slot: "operation" }
];

const statusOptions = [
  { value: "developing", label: "开发中" },
  { value: "active", label: "已上线" },
  { value: "archived", label: "已归档" },
  { value: "planned", label: "计划中" }
];

async function onSearch() {
  loading.value = true;
  try {
    dataList.value = await getProjects();
  } finally {
    loading.value = false;
  }
}

// ========== 新增/编辑 ==========
const dialogVisible = ref(false);
const dialogTitle = ref("新增项目");
const formRef = ref();
const form = ref(getDefaultForm());

function getDefaultForm() {
  return {
    id: 0,
    name: "",
    slug: "",
    description: "",
    long_description: "",
    cover_image: "",
    tech_stack: [] as string[],
    link_github: "",
    link_gitee: "",
    link_live: "",
    link_docs: "",
    status: "developing",
    status_label: "",
    is_featured: false,
    sort: 0
  };
}

const rules = {
  name: [{ required: true, message: "请输入项目名称", trigger: "blur" }],
  slug: [{ required: true, message: "请输入 Slug", trigger: "blur" }]
};

const techInput = ref("");

function addTech() {
  const val = techInput.value.trim();
  if (val && !form.value.tech_stack.includes(val)) {
    form.value.tech_stack.push(val);
  }
  techInput.value = "";
}

function removeTech(index: number) {
  form.value.tech_stack.splice(index, 1);
}

function openDialog(title: string, row?: ProjectItem) {
  dialogTitle.value = title;
  if (row) {
    form.value = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || "",
      long_description: row.long_description || "",
      cover_image: row.cover_image || "",
      tech_stack: Array.isArray(row.tech_stack) ? [...row.tech_stack] : [],
      link_github: row.link_github || "",
      link_gitee: row.link_gitee || "",
      link_live: row.link_live || "",
      link_docs: row.link_docs || "",
      status: row.status || "developing",
      status_label: row.status_label || "",
      is_featured: row.is_featured ?? false,
      sort: row.sort ?? 0
    };
  } else {
    form.value = getDefaultForm();
  }
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  try {
    const payload = { ...form.value };
    delete (payload as any).id;
    if (form.value.id) {
      await updateProject(form.value.id, payload);
      message("项目更新成功", { type: "success" });
    } else {
      await createProject(payload);
      message("项目创建成功", { type: "success" });
    }
    dialogVisible.value = false;
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "操作失败", { type: "error" });
  }
}

async function handleDelete(row: ProjectItem) {
  try {
    await deleteProject(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "删除失败", { type: "error" });
  }
}

// ========== 封面上传 ==========
const uploading = ref(false);

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
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
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function handleCoverUpload(uploadFile: any) {
  const file = uploadFile.raw || uploadFile.file || uploadFile;
  if (!file) return;
  uploading.value = true;
  try {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressed);
    const res = await http.request<{ url: string }>("post", "/api/upload/image", {
      data: formData,
      headers: { "Content-Type": "multipart/form-data" }
    });
    form.value.cover_image = res.url;
    message("封面上传成功", { type: "success" });
  } catch (e: any) {
    message(e?.message ?? "上传失败", { type: "error" });
  } finally {
    uploading.value = false;
  }
}

function getStatusLabel(status: string): string {
  return statusOptions.find(s => s.value === status)?.label ?? status;
}

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    developing: "warning",
    active: "success",
    archived: "info",
    planned: ""
  };
  return map[status] ?? "";
}

onMounted(() => onSearch());
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-medium">项目管理</span>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:add-circle-line')"
            @click="openDialog('新增项目')"
          >
            新增项目
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
        <template #cover="{ row }">
          <el-image
            v-if="row.cover_image"
            :src="row.cover_image"
            fit="cover"
            preview-teleported
            class="w-12 h-12 rounded-lg"
          />
          <span v-else class="text-gray-400 text-xs">无</span>
        </template>

        <template #tech="{ row }">
          <div class="flex flex-wrap gap-1">
            <el-tag
              v-for="t in (row.tech_stack || []).slice(0, 3)"
              :key="t"
              size="small"
              type="info"
            >
              {{ t }}
            </el-tag>
            <el-tag
              v-if="(row.tech_stack || []).length > 3"
              size="small"
              type="info"
            >
              +{{ row.tech_stack.length - 3 }}
            </el-tag>
            <span v-if="!row.tech_stack?.length" class="text-gray-400 text-xs"
              >-</span
            >
          </div>
        </template>

        <template #status="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ row.status_label || getStatusLabel(row.status) }}
          </el-tag>
        </template>

        <template #featured="{ row }">
          <el-tag :type="row.is_featured ? 'danger' : 'info'" size="small">
            {{ row.is_featured ? "精选" : "普通" }}
          </el-tag>
        </template>

        <template #operation="{ row }">
          <el-button
            link
            type="primary"
            :icon="useRenderIcon('ri:edit-line')"
            @click="openDialog('修改项目', row)"
          >
            修改
          </el-button>
          <el-popconfirm
            :title="`确认删除项目「${row.name}」？`"
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
      width="680px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="项目名称" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="form.slug" placeholder="url-friendly-slug" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="简短描述"
          />
        </el-form-item>
        <el-form-item label="详细介绍">
          <el-input
            v-model="form.long_description"
            type="textarea"
            :rows="4"
            placeholder="详细介绍（支持 Markdown）"
          />
        </el-form-item>
        <el-form-item label="封面图">
          <div class="flex items-center gap-4">
            <el-image
              v-if="form.cover_image"
              :src="form.cover_image"
              fit="cover"
              class="w-24 h-16 rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <div class="flex flex-col gap-2">
              <el-upload
                :show-file-list="false"
                :http-request="() => {}"
                :before-upload="() => false"
                :on-change="handleCoverUpload"
                accept="image/*"
              >
                <el-button :loading="uploading" type="primary" plain size="small">
                  {{ form.cover_image ? "更换封面" : "上传封面" }}
                </el-button>
              </el-upload>
              <el-input
                v-model="form.cover_image"
                size="small"
                placeholder="或输入封面 URL"
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="技术栈">
          <div class="flex flex-wrap gap-2 mb-2">
            <el-tag
              v-for="(t, i) in form.tech_stack"
              :key="i"
              closable
              @close="removeTech(i)"
            >
              {{ t }}
            </el-tag>
          </div>
          <div class="flex gap-2">
            <el-input
              v-model="techInput"
              size="small"
              placeholder="输入技术名称"
              @keyup.enter="addTech"
            />
            <el-button size="small" @click="addTech">添加</el-button>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" class="w-full">
            <el-option
              v-for="s in statusOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态标签">
          <el-input
            v-model="form.status_label"
            placeholder="自定义显示文本（可选）"
          />
        </el-form-item>
        <el-form-item label="GitHub">
          <el-input
            v-model="form.link_github"
            placeholder="https://github.com/..."
          />
        </el-form-item>
        <el-form-item label="Gitee">
          <el-input
            v-model="form.link_gitee"
            placeholder="https://gitee.com/..."
          />
        </el-form-item>
        <el-form-item label="线上地址">
          <el-input
            v-model="form.link_live"
            placeholder="https://..."
          />
        </el-form-item>
        <el-form-item label="文档地址">
          <el-input
            v-model="form.link_docs"
            placeholder="https://..."
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="精选">
          <el-switch
            v-model="form.is_featured"
            active-text="是"
            inactive-text="否"
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
