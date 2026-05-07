import type { UserInfo } from '@vben/types';

import { preferences } from '@vben/preferences';

import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    userInfo: UserInfo;
  }

  export interface UserLoginData {
    avatarUrl: string;
    phoneNumber: string;
    tenantId: number;
    token: string;
    userId: string;
    userName: string;
    userRole: number;
  }

}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const response = await requestClient.post<AuthApi.UserLoginData>(
    '/desk/userLogin',
    {
      appId: '1',
      deviceType: 'electron',
      secretCode: data.password,
      userName: data.username,
    },
  );

  return {
    accessToken: response.token,
    userInfo: {
      avatar: response.avatarUrl,
      desc: '',
      homePath: preferences.app.defaultHomePath,
      realName: response.userName,
      roles: [String(response.userRole)],
      token: response.token,
      userId: response.userId,
      username: response.userName,
    },
  } satisfies AuthApi.LoginResult;
}
