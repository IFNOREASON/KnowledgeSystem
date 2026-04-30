export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  gender?: number;
  birthday?: string;
  bio?: string;
  status?: number;
  lastLoginTime?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UpdateUserParams {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  gender?: number;
  birthday?: string;
  bio?: string;
}

export interface ExportData {
  basicInfo: {
    id: number;
    username: string;
    nickname?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    gender: string;
    birthday?: string;
    bio?: string;
    status: string;
    createTime?: string;
    lastLoginTime?: string;
  };
  exportInfo: {
    exportTime: string;
    dataSource: string;
  };
}
