// 基础合约服务已迁移到 services/contracts 目录
// 此文件保留以确保向后兼容
import * as contractService from './contracts/base';
import * as erc20Service from './contracts/erc20';
import * as routerService from './contracts/router';
import * as factoryService from './contracts/factory';

export * from './contracts/base';
export * from './contracts/erc20';
export * from './contracts/router';
export * from './contracts/factory';

export default {
  ...contractService,
  ...erc20Service,
  ...routerService,
  ...factoryService
};

