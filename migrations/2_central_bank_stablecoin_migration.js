// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023 Kentaro Hara
//
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const CentralBankStablecoin = artifacts.require("CentralBankStablecoin");

module.exports = async function (deployer) {
  const coin = await deployProxy(CentralBankStablecoin, []);
  console.log("CentralBankStablecoin address: ", coin.address);
};
