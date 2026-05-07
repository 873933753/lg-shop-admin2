<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BasicLayout, UserDropdown } from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: '个人中心',
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';

      await updateWatermark({
        advancedStyle: {
          colorStops: [
            {
              color: watermarkColor,
              offset: 0,
            },
            {
              color: watermarkColor,
              offset: 1,
            },
          ],
          type: 'linear',
        },
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.username"
        @logout="handleLogout"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
  </BasicLayout>
</template>

<style lang="scss" scoped>
:deep(header.bg-header) {
  background: linear-gradient(270deg, #e169ff, #7a73f4 47%, #3d50ff);
  border-bottom-color: rgba(255, 255, 255, 0.16);
  color: #fff;
}

:deep(.bg-sidebar),
:deep(.bg-sidebar-deep) {
  background: linear-gradient(0deg, #e169ff, #7a73f4 47%, #3d50ff) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  --menu-background-color: transparent;
  --menu-item-background-color: transparent;
  --menu-item-color: rgba(255, 255, 255, 0.96);
  --menu-item-hover-color: rgba(255, 255, 255, 0.98);
  --menu-item-hover-background-color: rgba(255, 255, 255, 0.18);
  --menu-item-active-color: #3d50ff;
  --menu-item-active-background-color: #ffffff;
}

:deep(.bg-sidebar .vben-menu),
:deep(.bg-sidebar .vben-menu__popup-container),
:deep(.bg-sidebar-deep .vben-menu),
:deep(.bg-sidebar-deep .vben-menu__popup-container),
:deep(.bg-sidebar .vben-normal-menu),
:deep(.bg-sidebar-deep .vben-normal-menu) {
  background: transparent !important;
  --menu-background-color: transparent !important;
  --menu-item-background-color: transparent !important;
}

:deep(header.bg-header *),
:deep(.bg-sidebar *),
:deep(.bg-sidebar-deep *) {
  color: rgba(255, 255, 255, 0.96);
}

:deep(header.bg-header svg),
:deep(.bg-sidebar svg),
:deep(.bg-sidebar-deep svg) {
  color: rgba(255, 255, 255, 0.96);
}

:deep(header.bg-header .text-muted-foreground),
:deep(.bg-sidebar .text-muted-foreground),
:deep(.bg-sidebar-deep .text-muted-foreground) {
  color: rgba(255, 255, 255, 0.78) !important;
}

:deep(header.bg-header .border-border),
:deep(.bg-sidebar .border-border),
:deep(.bg-sidebar-deep .border-border) {
  border-color: rgba(255, 255, 255, 0.16) !important;
}

:deep(header.bg-header [data-active='true']),
:deep(.bg-sidebar [data-active='true']),
:deep(.bg-sidebar-deep [data-active='true']) {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

:deep(header.bg-header .hover\:bg-accent:hover),
:deep(.bg-sidebar .hover\:bg-accent:hover),
:deep(.bg-sidebar-deep .hover\:bg-accent:hover) {
  background: rgba(255, 255, 255, 0.12) !important;
}

:deep(.bg-sidebar a[role='menuitem']),
:deep(.bg-sidebar-deep a[role='menuitem']) {
  color: rgba(255, 255, 255, 0.96) !important;
}

:deep(.bg-sidebar a[role='menuitem']:hover),
:deep(.bg-sidebar-deep a[role='menuitem']:hover) {
  background: rgba(255, 255, 255, 0.18) !important;
  color: rgba(255, 255, 255, 0.98) !important;
}

:deep(.bg-sidebar a[role='menuitem'].is-active),
:deep(.bg-sidebar-deep a[role='menuitem'].is-active) {
  background: #ffffff !important;
  color: #3d50ff !important;
}

:deep(.bg-sidebar a[role='menuitem'].is-active *),
:deep(.bg-sidebar-deep a[role='menuitem'].is-active *) {
  color: #3d50ff !important;
}

:deep(.bg-sidebar .vben-sub-menu > .vben-sub-menu-content),
:deep(.bg-sidebar-deep .vben-sub-menu > .vben-sub-menu-content) {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.96) !important;
}

:deep(.bg-sidebar .vben-sub-menu > .vben-sub-menu-content *),
:deep(.bg-sidebar-deep .vben-sub-menu > .vben-sub-menu-content *) {
  color: rgba(255, 255, 255, 0.96) !important;
}

:deep(.bg-sidebar .vben-sub-menu:not(.is-active) > .vben-sub-menu-content:hover),
:deep(.bg-sidebar-deep .vben-sub-menu:not(.is-active) > .vben-sub-menu-content:hover) {
  background: rgba(255, 255, 255, 0.18) !important;
  color: rgba(255, 255, 255, 0.98) !important;
}

:deep(.bg-sidebar .vben-sub-menu:not(.is-active) > .vben-sub-menu-content:hover *),
:deep(.bg-sidebar-deep .vben-sub-menu:not(.is-active) > .vben-sub-menu-content:hover *) {
  color: rgba(255, 255, 255, 0.98) !important;
}

:deep(.bg-sidebar .vben-sub-menu.is-active > .vben-sub-menu-content:hover),
:deep(.bg-sidebar-deep .vben-sub-menu.is-active > .vben-sub-menu-content:hover) {
  background: rgba(255, 255, 255, 0.18) !important;
  color: rgba(255, 255, 255, 0.98) !important;
}

:deep(.bg-sidebar .vben-sub-menu.is-active > .vben-sub-menu-content:hover *),
:deep(.bg-sidebar-deep .vben-sub-menu.is-active > .vben-sub-menu-content:hover *) {
  color: rgba(255, 255, 255, 0.98) !important;
}

:deep(.bg-sidebar .vben-normal-menu__item),
:deep(.bg-sidebar-deep .vben-normal-menu__item) {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.96) !important;
}

:deep(.bg-sidebar .vben-normal-menu__item:not(.is-active):hover),
:deep(.bg-sidebar-deep .vben-normal-menu__item:not(.is-active):hover) {
  background: rgba(255, 255, 255, 0.18) !important;
  color: rgba(255, 255, 255, 0.98) !important;
}

:deep(.bg-sidebar .vben-normal-menu__item:not(.is-active):hover *),
:deep(.bg-sidebar-deep .vben-normal-menu__item:not(.is-active):hover *) {
  color: rgba(255, 255, 255, 0.98) !important;
}

:deep(.bg-sidebar .vben-normal-menu__item.is-active),
:deep(.bg-sidebar-deep .vben-normal-menu__item.is-active) {
  background: #ffffff !important;
  color: #3d50ff !important;
}

:deep(.bg-sidebar .vben-normal-menu__item.is-active *),
:deep(.bg-sidebar-deep .vben-normal-menu__item.is-active *) {
  color: #3d50ff !important;
}

:deep(.bg-sidebar .vben-normal-menu__item.is-active:hover),
:deep(.bg-sidebar-deep .vben-normal-menu__item.is-active:hover) {
  background: rgba(255, 255, 255, 0.18) !important;
  color: rgba(255, 255, 255, 0.98) !important;
}

:deep(.bg-sidebar .vben-normal-menu__item.is-active:hover *),
:deep(.bg-sidebar-deep .vben-normal-menu__item.is-active:hover *) {
  color: rgba(255, 255, 255, 0.98) !important;
}

:deep(main.bg-background-deep) {
  background: #fff;
}
</style>
