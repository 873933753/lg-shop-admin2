import type { RouteRecordRaw } from 'vue-router'

import { $t } from '#/locales'

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:store-outline',
      order: 2,
      title: $t('page.mall.title'),
    },
    name: 'Mall',
    path: '/mall',
    children: [
      {
        name: 'MallCategory',
        path: '/mall/category',
        component: () => import('#/views/mall/category/index.vue'),
        meta: {
          icon: 'mdi:shape-outline',
          title: $t('page.mall.category'),
        },
      },
      {
        name: 'MallProduct',
        path: '/mall/product',
        component: () => import('#/views/mall/product/index.vue'),
        meta: {
          icon: 'mdi:package-variant-closed',
          title: $t('page.mall.product'),
        },
      },
      {
        name: 'MallUser',
        path: '/mall/user',
        component: () => import('#/views/mall/user/index.vue'),
        meta: {
          icon: 'mdi:account-group-outline',
          title: $t('page.mall.user'),
        },
      },
      {
        name: 'MallOrder',
        path: '/mall/order',
        component: () => import('#/views/mall/order/index.vue'),
        meta: {
          icon: 'mdi:receipt-text-outline',
          title: $t('page.mall.order'),
        },
      },
    ],
  },
]

export default routes
