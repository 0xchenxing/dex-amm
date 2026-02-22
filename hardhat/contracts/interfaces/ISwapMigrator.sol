// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISwapMigrator {
    function migrate(address token, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external;
}