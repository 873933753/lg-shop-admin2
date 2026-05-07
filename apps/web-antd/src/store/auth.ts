import type { Recordable, UserInfo } from '@vben/types'

import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { LOGIN_PATH } from '@vben/constants'
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores'

import { notification } from 'ant-design-vue'
import { defineStore } from 'pinia'

import { loginApi } from '#/api'
import { $t } from '#/locales'
import { normalizeAppPath } from '#/router/path'

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore()
  const userStore = useUserStore()
  const router = useRouter()

  const loginLoading = ref(false)

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(params: Recordable<any>, onSuccess?: () => Promise<void> | void) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null
    try {
      loginLoading.value = true
      const { accessToken, userInfo: loginUserInfo } = await loginApi(params)
      const normalizedUserInfo = {
        ...loginUserInfo,
        homePath: normalizeAppPath(loginUserInfo.homePath),
      }

      // 如果成功获取到 accessToken
      if (accessToken) {
        accessStore.setAccessToken(accessToken)
        userStore.setUserInfo(normalizedUserInfo)

        userInfo = normalizedUserInfo

        userStore.setUserInfo(userInfo)
        accessStore.setAccessCodes([])

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false)
        } else {
          onSuccess ? await onSuccess?.() : await router.push(normalizeAppPath(userInfo.homePath))
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          })
        }
      }
    } finally {
      loginLoading.value = false
    }

    return {
      userInfo,
    }
  }

  async function logout(redirect: boolean = true) {
    resetAllStores()
    accessStore.setLoginExpired(false)

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    })
  }

  async function fetchUserInfo() {
    const userInfo = userStore.userInfo as null | UserInfo
    if (!userInfo) {
      throw new Error('User info is unavailable. Please login again.')
    }
    const normalizedUserInfo = {
      ...userInfo,
      homePath: normalizeAppPath(userInfo.homePath),
    }
    userStore.setUserInfo(normalizedUserInfo)
    return normalizedUserInfo
  }

  function $reset() {
    loginLoading.value = false
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  }
})
