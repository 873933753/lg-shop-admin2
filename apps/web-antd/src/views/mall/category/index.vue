<script lang="ts" setup>
import type { TableColumnsType, UploadProps } from 'ant-design-vue';
import type { Key } from 'ant-design-vue/es/_util/type';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
  Table,
  TreeSelect,
  Upload,
} from 'ant-design-vue';

import rawCategoryData from './data.js';

defineOptions({ name: 'MallCategory' });

interface RawNode {
  id: string;
  dictCode: string;
  icon: string;
  label: string;
  parentId: string;
  sort?: number;
  children: null | RawNode[];
}

interface CategoryNode {
  id: string;
  name: string;
  dictCode: string;
  label: string;
  icon: string;
  parentId: string;
  immediateParentId: null | string;
  sort: number;
  level: number;
  status: 0 | 1;
  productCount: number;
  createTime: string;
  deletedAt: null | string;
  children?: CategoryNode[];
}

const MAX_LEVEL = 3;

const sourceTree = ref<CategoryNode[]>([]);
const keyword = ref('');
const expandedKeys = ref<Key[]>([]);
const modalOpen = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const editingId = ref<null | string>(null);
const formRef = ref<FormInstance>();

const formState = reactive({
  name: '',
  parentId: undefined as string | undefined,
  sort: 0,
  status: true,
  icon: '' as string,
});

const formRules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur', type: 'string' }],
  sort: [{ required: true, type: 'number', message: '请输入排序值', trigger: 'change' }],
};

function normalizeImported(raw: RawNode[]): CategoryNode[] {
  function walk(nodes: RawNode[], parent: CategoryNode | null): CategoryNode[] {
    return nodes.map((rn, idx) => {
      const id = String(rn.id);
      const parentIdStr = rn.parentId;
      const immediateParentId =
        parentIdStr === '0' ? null : parentIdStr.split(',').pop() || null;
      const level = parent ? parent.level + 1 : 1;
      const arr = Array.isArray(rn.children) ? rn.children : [];
      const node: CategoryNode = {
        id,
        name: rn.label || rn.dictCode,
        dictCode: rn.dictCode,
        label: rn.label,
        icon: rn.icon || '',
        parentId: parentIdStr,
        immediateParentId,
        sort: rn.sort ?? idx + 1,
        level,
        status: 1,
        productCount: Number(id) % 11,
        createTime: `2025-12-${String((Number(id) % 28) + 1).padStart(2, '0')} 10:00:00`,
        deletedAt: null,
        children: undefined,
      };
      if (arr.length > 0) {
        node.children = walk(arr, node);
      }
      return node;
    });
  }
  return walk(raw, null);
}

function collectExpandableKeys(nodes: CategoryNode[]): Key[] {
  const keys: Key[] = [];
  for (const n of nodes) {
    if (n.deletedAt) continue;
    if (n.children?.some((c) => !c.deletedAt)) {
      keys.push(n.id, ...collectExpandableKeys(n.children.filter((c) => !c.deletedAt)));
    }
  }
  return keys;
}

function findNode(list: CategoryNode[], id: string): CategoryNode | null {
  for (const n of list) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const f = findNode(n.children, id);
      if (f) return f;
    }
  }
  return null;
}

function findParentPosition(
  list: CategoryNode[],
  id: string,
  parent: CategoryNode | null = null,
): null | { index: number; parent: CategoryNode | null; siblings: CategoryNode[] } {
  for (let i = 0; i < list.length; i++) {
    const n = list[i];
    if (!n || n.deletedAt) continue;
    if (n.id === id) return { parent, index: i, siblings: list };
    if (n.children?.length) {
      const f = findParentPosition(n.children, id, n);
      if (f) return f;
    }
  }
  return null;
}

function collectSubtreeIds(root: CategoryNode | null): Set<string> {
  const s = new Set<string>();
  function w(n: CategoryNode) {
    s.add(n.id);
    n.children?.filter((c) => !c.deletedAt).forEach((child) => {
      w(child);
    });
  }
  if (root) w(root);
  return s;
}

function filterDeleted(nodes: CategoryNode[]): CategoryNode[] {
  return nodes
    .filter((n) => !n.deletedAt)
    .map((n) => ({
      ...n,
      children: n.children?.length ? filterDeleted(n.children) : undefined,
    }));
}

function filterByKeyword(nodes: CategoryNode[], kw: string): CategoryNode[] {
  const lower = kw.trim().toLowerCase();
  if (!lower) {
    return nodes.filter((n) => !n.deletedAt);
  }
  const out: CategoryNode[] = [];
  for (const n of nodes) {
    if (n.deletedAt) continue;
    const sub = n.children ? filterByKeyword(n.children, kw) : [];
    const hit = n.name.toLowerCase().includes(lower) || n.id.includes(kw.trim());
    if (hit) {
      out.push({
        ...n,
        children: n.children?.filter((c) => !c.deletedAt),
      });
    } else if (sub.length > 0) {
      out.push({ ...n, children: sub });
    }
  }
  return out;
}

const displayTree = computed(() => {
  const active = filterDeleted(sourceTree.value);
  return filterByKeyword(active, keyword.value);
});

function computeChildParentId(parent: CategoryNode): string {
  if (parent.parentId === '0') return parent.id;
  return `${parent.parentId},${parent.id}`;
}

function maxNumericId(nodes: CategoryNode[]): number {
  let m = 0;
  function walk(list: CategoryNode[]) {
    for (const n of list) {
      const v = Number(n.id);
      if (!Number.isNaN(v)) m = Math.max(m, v);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(nodes);
  return m;
}

function setSubtreeStatus(node: CategoryNode, status: 0 | 1) {
  node.status = status;
  node.children?.filter((c) => !c.deletedAt).forEach((c) => {
    setSubtreeStatus(c, status);
  });
}

function onTableStatusChange(record: CategoryNode, checked: boolean) {
  const node = findNode(sourceTree.value, record.id);
  if (!node) return;
  if (checked) {
    node.status = 1;
    message.success('已启用');
  } else {
    setSubtreeStatus(node, 0);
    message.success('已禁用该分类及其子分类');
  }
}

function sortSiblings(siblings: CategoryNode[]) {
  siblings.sort((a, b) => a.sort - b.sort || Number(a.id) - Number(b.id));
}

function moveInSiblings(tree: CategoryNode[], id: string, dir: -1 | 1) {
  const pos = findParentPosition(tree, id);
  if (!pos) return;
  const { siblings } = pos;
  const active = siblings.filter((n) => !n.deletedAt);
  sortSiblings(active);
  const idx = active.findIndex((n) => n.id === id);
  const j = idx + dir;
  if (idx < 0 || j < 0 || j >= active.length) {
    message.warning('已在同级边界，无法移动');
    return;
  }
  const a = active[idx];
  const b = active[j];
  if (!a || !b) return;
  const tmp = a.sort;
  a.sort = b.sort;
  b.sort = tmp;
  sortSiblings(siblings);
  message.success(dir === -1 ? '已上移' : '已下移');
}

function extractNode(tree: CategoryNode[], nodeId: string): CategoryNode | null {
  const pos = findParentPosition(tree, nodeId);
  if (!pos) return null;
  const [removed] = pos.siblings.splice(pos.index, 1);
  if (pos.parent && pos.siblings.length === 0) {
    pos.parent.children = undefined;
  }
  return removed ?? null;
}

function reparentDetached(detached: CategoryNode, newParent: CategoryNode | null) {
  if (!newParent) {
    detached.parentId = '0';
    detached.level = 1;
    detached.immediateParentId = null;
    return;
  }
  detached.parentId = computeChildParentId(newParent);
  detached.level = newParent.level + 1;
  detached.immediateParentId = newParent.id;
}

function reparentLeaf(tree: CategoryNode[], nodeId: string, newParentId: string | undefined) {
  const node = findNode(tree, nodeId);
  if (!node) return false;

  if (newParentId === undefined || newParentId === '') {
    const detached = extractNode(tree, nodeId);
    if (!detached) return false;
    reparentDetached(detached, null);
    tree.push(detached);
    sortSiblings(tree);
    return true;
  }

  const parent = findNode(tree, newParentId);
  if (!parent || parent.deletedAt) return false;
  if (parent.level >= MAX_LEVEL) {
    message.error('父级分类层级过深');
    return false;
  }
  if (parent.level + 1 > MAX_LEVEL) {
    message.error('分类最大支持 3 级');
    return false;
  }

  const detached = extractNode(tree, nodeId);
  if (!detached) return false;
  reparentDetached(detached, parent);
  if (!parent.children) parent.children = [];
  parent.children.push(detached);
  sortSiblings(parent.children);
  return true;
}

const treeSelectData = computed(() => {
  function mapNodes(nodes: CategoryNode[], excludeIds: Set<string>): Array<Record<string, unknown>> {
    return nodes
      .filter((n) => !n.deletedAt && !excludeIds.has(n.id))
      .map((n) => ({
        title: n.name,
        value: n.id,
        disabled: n.level >= MAX_LEVEL,
        children:
          n.children?.length === undefined
            ? undefined
            : mapNodes(n.children.filter((c) => !c.deletedAt), excludeIds),
      }));
  }
  const exclude =
    modalMode.value === 'edit' && editingId.value
      ? collectSubtreeIds(findNode(sourceTree.value, editingId.value))
      : new Set<string>();
  return mapNodes(sourceTree.value, exclude);
});

function openAdd() {
  modalMode.value = 'add';
  editingId.value = null;
  formState.name = '';
  formState.parentId = undefined;
  formState.sort = 0;
  formState.status = true;
  formState.icon = '';
  modalOpen.value = true;
}

function openEdit(record: CategoryNode) {
  const node = findNode(sourceTree.value, record.id);
  if (!node) return;
  modalMode.value = 'edit';
  editingId.value = node.id;
  formState.name = node.name;
  formState.parentId = node.immediateParentId ?? undefined;
  formState.sort = node.sort;
  formState.status = node.status === 1;
  formState.icon = node.icon || '';
  modalOpen.value = true;
}

const parentLocked = computed(() => {
  if (modalMode.value !== 'edit' || !editingId.value) return false;
  const n = findNode(sourceTree.value, editingId.value);
  const activeChildren = n?.children?.filter((c) => !c.deletedAt) ?? [];
  return activeChildren.length > 0;
});

async function handleModalOk() {
  try {
    await formRef.value?.validate();
  } catch {
    throw undefined;
  }

  const name = formState.name.trim();
  if (!name) {
    message.error('请输入分类名称');
    throw undefined;
  }

  if (modalMode.value === 'add') {
    let parent: CategoryNode | null = null;
    if (formState.parentId) {
      parent = findNode(sourceTree.value, formState.parentId);
      if (!parent) {
        message.error('父级分类不存在');
        throw undefined;
      }
      if (parent.level >= MAX_LEVEL) {
        message.error('不能在第 3 级分类下继续新增');
        throw undefined;
      }
      if (parent.level + 1 > MAX_LEVEL) {
        message.error('分类最大支持 3 级');
        throw undefined;
      }
    }

    const nid = String(maxNumericId(sourceTree.value) + 1);
    const sort = Number.isFinite(formState.sort) ? Math.trunc(formState.sort) : 0;
    const newNode: CategoryNode = {
      id: nid,
      name,
      dictCode: name,
      label: name,
      icon: formState.icon || '',
      parentId: '',
      immediateParentId: parent?.id ?? null,
      sort,
      level: 1,
      status: formState.status ? 1 : 0,
      productCount: 0,
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      deletedAt: null,
      children: undefined,
    };

    if (parent) {
      newNode.parentId = computeChildParentId(parent);
      newNode.level = parent.level + 1;
      if (!parent.children) parent.children = [];
      parent.children.push(newNode);
      sortSiblings(parent.children);
    } else {
      newNode.parentId = '0';
      newNode.level = 1;
      sourceTree.value.push(newNode);
      sortSiblings(sourceTree.value);
    }

    if (!formState.status) {
      setSubtreeStatus(newNode, 0);
    }

    message.success('新增成功');
    modalOpen.value = false;
    return;
  }

  const id = editingId.value;
  if (!id) throw undefined;
  const existing = findNode(sourceTree.value, id);
  if (!existing) throw undefined;

  const hasChildren = (existing.children?.filter((c) => !c.deletedAt).length ?? 0) > 0;
  if (!hasChildren) {
    const targetParent = formState.parentId ?? undefined;
    const currentParent = existing.immediateParentId ?? undefined;
    const pidChanged = targetParent !== currentParent;
    if (pidChanged) {
      if (targetParent) {
        const p = findNode(sourceTree.value, targetParent);
        if (!p || p.deletedAt) {
          message.error('父级分类无效');
          throw undefined;
        }
        if (p.level + 1 > MAX_LEVEL) {
          message.error('移动后将超过 3 级，请重新选择父级');
          throw undefined;
        }
      }
      const ok = reparentLeaf(sourceTree.value, id, targetParent);
      if (!ok) {
        message.error('父级调整失败');
        throw undefined;
      }
    }
  }

  const node = findNode(sourceTree.value, id);
  if (!node) throw undefined;

  node.name = name;
  node.label = name;
  node.dictCode = name;
  node.sort = Number.isFinite(formState.sort) ? Math.trunc(formState.sort) : 0;
  node.icon = formState.icon || '';

  if (formState.status) {
    node.status = 1;
  } else {
    setSubtreeStatus(node, 0);
  }

  const pos = findParentPosition(sourceTree.value, id);
  if (pos?.parent?.children) sortSiblings(pos.parent.children);
  else sortSiblings(sourceTree.value);

  message.success('保存成功');
  modalOpen.value = false;
}

function handleDelete(record: CategoryNode) {
  const node = findNode(sourceTree.value, record.id);
  if (!node || node.deletedAt) return;

  const activeChildren = node.children?.filter((c) => !c.deletedAt) ?? [];
  if (activeChildren.length > 0) {
    message.warning('该分类下存在子分类，无法删除');
    return;
  }
  if (node.productCount > 0) {
    message.warning(`该分类已关联 ${node.productCount} 个商品，无法删除`);
    return;
  }

  Modal.confirm({
    title: '确认删除该分类？',
    content: '删除为软删除（标记 deleted_at），可在后续接入接口时提交后端。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      node.deletedAt = new Date().toISOString();
      message.success('已软删除');
    },
  });
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImg = file.type.startsWith('image/');
  if (!isImg) {
    message.error('只能上传图片');
    return Upload.LIST_IGNORE;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    formState.icon = String(reader.result || '');
  });
  reader.readAsDataURL(file);
  return false;
};

function expandAll() {
  expandedKeys.value = collectExpandableKeys(filterDeleted(sourceTree.value));
}

function collapseAll() {
  expandedKeys.value = [];
}

const columns = computed<TableColumnsType<CategoryNode>>(() => [
  { title: '分类ID', dataIndex: 'id', width: 96, ellipsis: true },
  {
    title: '图标',
    key: 'icon',
    width: 72,
    customRender: ({ record }) =>
      record.icon
        ? h(Image, { src: record.icon, width: 36, height: 36, style: { objectFit: 'cover' } })
        : h('span', { class: 'text-slate-400' }, '—'),
  },
  { title: '名称', dataIndex: 'name', ellipsis: true, minWidth: 160 },
  { title: '级别', dataIndex: 'level', width: 72 },
  { title: '排序值', dataIndex: 'sort', width: 88 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    customRender: ({ record }) =>
      h(Switch, {
        checked: record.status === 1,
        checkedChildren: '启用',
        unCheckedChildren: '禁用',
        'onUpdate:checked': (c: boolean | number | string) =>
          onTableStatusChange(record as CategoryNode, Boolean(c)),
      }),
  },
  { title: '关联商品数', dataIndex: 'productCount', width: 112 },
  { title: '创建时间', dataIndex: 'createTime', width: 168, ellipsis: true },
  { title: '操作', key: 'action', width: 296, fixed: 'right' },
]);

function asRow(r: unknown): CategoryNode {
  return r as CategoryNode;
}

onMounted(() => {
  sourceTree.value = normalizeImported(rawCategoryData as RawNode[]);
});
</script>

<template>
  <div class="category-manage min-h-full p-4 lg:p-6">
    <Card title="分类管理" :bordered="false">
      <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <Space wrap>
          <Input
            v-model:value="keyword"
            allow-clear
            placeholder="按名称或分类 ID 查询"
            style="width: 240px"
            @press-enter="() => {}"
          />
          <Button type="primary" @click="openAdd">新增分类</Button>
          <Button @click="expandAll">展开全部</Button>
          <Button @click="collapseAll">收缩全部</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="displayTree"
        :expanded-row-keys="expandedKeys"
        :pagination="false"
        :scroll="{ x: 1280, y: 'calc(100vh - 320px)' }"
        row-key="id"
        size="middle"
        @update:expanded-row-keys="(k: Key[]) => (expandedKeys = k)"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Space wrap :size="0">
              <Button size="small" type="link" @click="openEdit(asRow(record))"> 编辑 </Button>
              <Button size="small" type="link" @click="moveInSiblings(sourceTree, asRow(record).id, -1)">
                上移
              </Button>
              <Button size="small" type="link" @click="moveInSiblings(sourceTree, asRow(record).id, 1)">
                下移
              </Button>
              <Button danger size="small" type="link" @click="handleDelete(asRow(record))"> 删除 </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="modalOpen"
      :destroy-on-close="true"
      :title="modalMode === 'add' ? '新增分类' : '编辑分类'"
      ok-text="保存"
      width="520"
      @ok="handleModalOk"
    >
      <Form ref="formRef" :model="formState" :rules="formRules" class="mt-2" layout="vertical">
        <Form.Item label="分类名称" name="name">
          <Input v-model:value="formState.name" allow-clear placeholder="请输入分类名称" />
        </Form.Item>
        <Form.Item label="父级分类" name="parentId">
          <TreeSelect
            v-model:value="formState.parentId"
            :disabled="parentLocked"
            :dropdown-style="{ maxHeight: '320px', overflow: 'auto' }"
            :field-names="{ label: 'title', value: 'value', children: 'children' }"
            :tree-data="treeSelectData"
            allow-clear
            placeholder="不选则为顶级分类"
            show-search
            tree-default-expand-all
            tree-line
            tree-node-filter-prop="title"
          />
        </Form.Item>
        <Form.Item label="排序值" name="sort">
          <InputNumber v-model:value="formState.sort" :min="0" :precision="0" class="w-full" />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Switch v-model:checked="formState.status" checked-children="启用" un-checked-children="禁用" />
        </Form.Item>
        <Form.Item label="分类图标">
          <Upload
            :max-count="1"
            :show-upload-list="true"
            accept="image/*"
            list-type="picture-card"
            :before-upload="beforeUpload"
          >
            <div v-if="!formState.icon" class="flex flex-col items-center justify-center text-slate-500">
              <IconifyIcon class="size-6" icon="mdi:plus" />
              <span class="mt-1 text-xs">上传</span>
            </div>
          </Upload>
          <div v-if="formState.icon" class="mt-2">
            <Image :src="formState.icon" class="rounded border border-slate-100" :width="96" />
          </div>
        </Form.Item>
        <p v-if="parentLocked" class="text-xs text-slate-500">
          当前分类下已有子分类，不可修改父级（避免误移动整棵子树）。
        </p>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.category-manage :deep(.ant-input:focus),
.category-manage :deep(.ant-input-affix-wrapper-focused),
.category-manage :deep(.ant-input-number-focused),
.category-manage :deep(.ant-input-number:focus-within),
.category-manage :deep(.ant-select-focused .ant-select-selector),
.category-manage :deep(.ant-tree-select .ant-select-focused .ant-select-selector) {
  border-color: hsl(245 82% 67%) !important;
  box-shadow: 0 0 0 2px hsl(245 82% 67% / 22%) !important;
}
</style>
