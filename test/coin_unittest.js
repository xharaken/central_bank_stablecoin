// Copyright (c) 2023 Kentaro Hara
//
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php

const { deployProxy, upgradeProxy } =
      require('@openzeppelin/truffle-upgrades');

const CentralBankStablecoin = artifacts.require("CentralBankStablecoin");

should_throw = async (callback, match) => {
  let threw = false;
  let exception;
  try {
    await callback();
  } catch (e) {
    exception = e;
    if (e.toString().indexOf(match) == -1) {
      console.log(e);
    } else {
      threw = true;
    }
  } finally {
    if (!threw) {
      console.log(exception);
    }
    assert.equal(threw, true);
  }
};

contract("CoinUnittest", function (accounts) {
  it("CentralBankStablecoin", async function () {
    let coin = await deployProxy(CentralBankStablecoin, []);

    assert.equal((await coin.totalSupply()), 0);
    
    // balanceOf
    assert.equal(await coin.balanceOf(accounts[1]), 0);
    
    // mint
    await coin.mint(accounts[1], 1);
    assert.equal(await coin.totalSupply(), 1);
    assert.equal(await coin.balanceOf(accounts[1]), 1);
    
    await coin.mint(accounts[1], 1);
    assert.equal(await coin.totalSupply(), 2);
    assert.equal(await coin.balanceOf(accounts[1]), 2);
    
    await coin.mint(accounts[1], 0);
    assert.equal(await coin.totalSupply(), 2);
    assert.equal(await coin.balanceOf(accounts[1]), 2);
    
    await coin.mint(accounts[2], 0);
    assert.equal(await coin.totalSupply(), 2);
    assert.equal(await coin.balanceOf(accounts[1]), 2);
    assert.equal(await coin.balanceOf(accounts[2]), 0);
    
    await coin.mint(accounts[2], 100);
    assert.equal(await coin.totalSupply(), 102);
    assert.equal(await coin.balanceOf(accounts[1]), 2);
    assert.equal(await coin.balanceOf(accounts[2]), 100);
    
    // burn
    await coin.burn(accounts[1], 1);
    assert.equal(await coin.totalSupply(), 101);
    assert.equal(await coin.balanceOf(accounts[1]), 1);
    assert.equal(await coin.balanceOf(accounts[2]), 100);
    
    await coin.burn(accounts[1], 0);
    assert.equal(await coin.totalSupply(), 101);
    assert.equal(await coin.balanceOf(accounts[1]), 1);
    assert.equal(await coin.balanceOf(accounts[2]), 100);
    
    await should_throw(async () => {
      await coin.burn(accounts[3], 1);
    }, "ERC20");
    
    await should_throw(async () => {
      await coin.burn(accounts[1], 2);
    }, "ERC20");
    
    await should_throw(async () => {
      await coin.burn(accounts[2], 101);
    }, "ERC20");
    
    await coin.burn(accounts[1], 1);
    assert.equal(await coin.totalSupply(), 100);
    assert.equal(await coin.balanceOf(accounts[1]), 0);
    assert.equal(await coin.balanceOf(accounts[2]), 100);
    
    await coin.burn(accounts[2], 100);
    assert.equal(await coin.totalSupply(), 0);
    assert.equal(await coin.balanceOf(accounts[1]), 0);
    assert.equal(await coin.balanceOf(accounts[2]), 0);
    
    await coin.burn(accounts[2], 0);
    assert.equal(await coin.totalSupply(), 0);
    assert.equal(await coin.balanceOf(accounts[1]), 0);
    assert.equal(await coin.balanceOf(accounts[2]), 0);
    
    // move
    await coin.mint(accounts[1], 100);
    await coin.mint(accounts[2], 200);
    assert.equal(await coin.totalSupply(), 300);
    assert.equal(await coin.balanceOf(accounts[1]), 100);
    assert.equal(await coin.balanceOf(accounts[2]), 200);
    
    await coin.move(accounts[1], accounts[2], 10);
    assert.equal(await coin.totalSupply(), 300);
    assert.equal(await coin.balanceOf(accounts[1]), 90);
    assert.equal(await coin.balanceOf(accounts[2]), 210);
    
    await coin.move(accounts[2], accounts[1], 200);
    assert.equal(await coin.totalSupply(), 300);
    assert.equal(await coin.balanceOf(accounts[1]), 290);
    assert.equal(await coin.balanceOf(accounts[2]), 10);
    
    await coin.move(accounts[2], accounts[1], 0);
    assert.equal(await coin.totalSupply(), 300);
    assert.equal(await coin.balanceOf(accounts[1]), 290);
    assert.equal(await coin.balanceOf(accounts[2]), 10);
    
    await coin.move(accounts[4], accounts[2], 0);
    assert.equal(await coin.totalSupply(), 300);
    assert.equal(await coin.balanceOf(accounts[1]), 290);
    assert.equal(await coin.balanceOf(accounts[2]), 10);
    
    await should_throw(async () => {
      await coin.move(accounts[1], accounts[2], 291);
    }, "ERC20");
    
    await should_throw(async () => {
      await coin.move(accounts[5], accounts[2], 1);
    }, "ERC20");
    
    await coin.move(accounts[2], accounts[3], 1);
    assert.equal(await coin.totalSupply(), 300);
    assert.equal(await coin.balanceOf(accounts[1]), 290);
    assert.equal(await coin.balanceOf(accounts[2]), 9);
    assert.equal(await coin.balanceOf(accounts[3]), 1);
    
    await coin.move(accounts[2], accounts[5], 1);
    assert.equal(await coin.totalSupply(), 300);
    assert.equal(await coin.balanceOf(accounts[1]), 290);
    assert.equal(await coin.balanceOf(accounts[2]), 8);
    assert.equal(await coin.balanceOf(accounts[3]), 1);
    assert.equal(await coin.balanceOf(accounts[5]), 1);    
  });
  
  it("Ownable", async function () {
    let coin = await CentralBankStablecoin.new({from: accounts[1]});
    await coin.initialize({from: accounts[1]});
    await coin.mint(accounts[1], 10, {from: accounts[1]});
    assert.equal(await coin.balanceOf(accounts[1]), 10);
    
    await should_throw(async () => {
      await coin.initialize({from: accounts[1]});
    }, "Initializable");
    
    await should_throw(async () => {
      await coin.mint(accounts[1], 1);
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.burn(accounts[1], 0);
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.move(accounts[1], accounts[2], 0);
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.addToBlocklist(accounts[1]);
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.removeFromBlocklist(accounts[1]);
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.pause();
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.unpause();
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.mint(accounts[1], 1, {from: accounts[2]});
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.burn(accounts[1], 0, {from: accounts[2]});
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.move(accounts[1], accounts[2], 0, {from: accounts[2]});
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.addToBlocklist(accounts[1], {from: accounts[2]});
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.removeFromBlocklist(accounts[1], {from: accounts[2]});
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.pause({from: accounts[2]});
    }, "Ownable");
    
    await should_throw(async () => {
      await coin.unpause({from: accounts[2]});
    }, "Ownable");
    
    await coin.transfer(accounts[2], 1, {from: accounts[1]});
    assert.equal(await coin.balanceOf(accounts[1]), 9);
    assert.equal(await coin.balanceOf(accounts[2]), 1);
  });
  
  it("Pausable", async function () {
    let coin = await deployProxy(CentralBankStablecoin, []);
    await coin.mint(accounts[1], 10);
    assert.equal(await coin.balanceOf(accounts[1]), 10);
    
    await coin.pause();
    
    await should_throw(async () => {
      await coin.mint(accounts[1], 1);
    }, "Pausable");
    
    await should_throw(async () => {
      await coin.burn(accounts[1], 0);
    }, "Pausable");
    
    await should_throw(async () => {
      await coin.move(accounts[1], accounts[2], 0);
    }, "Pausable");
    
    await should_throw(async () => {
      await coin.transfer(accounts[2], 1, {from: accounts[1]});
    }, "Pausable");
    
    assert.equal(await coin.totalSupply(), 10);
    assert.equal(await coin.balanceOf(accounts[1]), 10);
    
    await coin.unpause();
    
    await coin.mint(accounts[1], 10);
    await coin.burn(accounts[1], 1);
    await coin.move(accounts[1], accounts[2], 10);
    await coin.transfer(accounts[2], 1, {from: accounts[1]});
    assert.equal(await coin.totalSupply(), 19);
    assert.equal(await coin.balanceOf(accounts[1]), 8);
    assert.equal(await coin.balanceOf(accounts[2]), 11);
  });
  
  it("ERC20", async function () {
    let coin = await deployProxy(CentralBankStablecoin, []);
    assert.equal(await coin.name(), "CentralBankStablecoin");
    assert.equal(await coin.symbol(), "CBS");
    assert.equal(await coin.decimals(), 0);
    assert.equal(await coin.totalSupply(), 0);
    
    await coin.mint(accounts[1], 100);
    assert.equal(await coin.totalSupply(), 100);
    await coin.transfer(accounts[2], 10, {from: accounts[1]});
    assert.equal(await coin.balanceOf(accounts[1]), 90);
    assert.equal(await coin.balanceOf(accounts[2]), 10);
    await coin.transfer(accounts[3], 10, {from: accounts[2]});
    assert.equal(await coin.balanceOf(accounts[1]), 90);
    assert.equal(await coin.balanceOf(accounts[2]), 0);
    assert.equal(await coin.balanceOf(accounts[3]), 10);
    await coin.transfer(accounts[3], 0, {from: accounts[2]});
    assert.equal(await coin.balanceOf(accounts[1]), 90);
    assert.equal(await coin.balanceOf(accounts[2]), 0);
    assert.equal(await coin.balanceOf(accounts[3]), 10);
    
    await should_throw(async () => {
      await coin.transfer(accounts[3], 1, {from: accounts[2]});
    }, "ERC20");
    
    await should_throw(async () => {
      await coin.transfer(accounts[4], 11, {from: accounts[3]});
    }, "ERC20");
    
    await coin.approve(accounts[7], 10, {from: accounts[1]});
    assert.equal(await coin.allowance(accounts[1], accounts[7]), 10);
    await coin.approve(accounts[7], 15, {from: accounts[1]});
    assert.equal(await coin.allowance(accounts[1], accounts[7]), 15);
    await coin.transferFrom(accounts[1], accounts[2], 10, {from: accounts[7]});
    await coin.transferFrom(accounts[1], accounts[2], 2, {from: accounts[7]});
    assert.equal(await coin.balanceOf(accounts[1]), 78);
    assert.equal(await coin.balanceOf(accounts[2]), 12);
    assert.equal(await coin.balanceOf(accounts[3]), 10);
    assert.equal(await coin.allowance(accounts[1], accounts[7]), 3);
    
    await should_throw(async () => {
      await coin.transferFrom(accounts[1], accounts[2], 4, {from: accounts[7]});
    }, "ERC20");
    
    await should_throw(async () => {
      await coin.transferFrom(accounts[3], accounts[2], 1, {from: accounts[7]});
    }, "ERC20");
    
    await should_throw(async () => {
      await coin.transferFrom(accounts[1], accounts[2], 1, {from: accounts[1]});
    }, "ERC20");
    
    await coin.increaseAllowance(accounts[7], 10, {from: accounts[1]});
    assert.equal(await coin.allowance(accounts[1], accounts[7]), 13);
    await coin.increaseAllowance(accounts[7], 1000, {from: accounts[1]});
    assert.equal(await coin.allowance(accounts[1], accounts[7]), 1013);
    await coin.decreaseAllowance(accounts[7], 100, {from: accounts[1]});
    assert.equal(await coin.allowance(accounts[1], accounts[7]), 913);
    
    await should_throw(async () => {
      await coin.transferFrom(accounts[1], accounts[2], 100,
                              {from: accounts[7]});
    }, "ERC20");
    
    await coin.transferFrom(accounts[1], accounts[2], 78,
                            {from: accounts[7]});
    assert.equal(await coin.balanceOf(accounts[1]), 0);
    assert.equal(await coin.balanceOf(accounts[2]), 90);
    assert.equal(await coin.balanceOf(accounts[3]), 10);
    assert.equal(await coin.allowance(accounts[1], accounts[7]), 913 - 78);

    // Blocklist
    await coin.addToBlocklist(accounts[2]);
    await coin.move(accounts[2], accounts[3], 10);
    await coin.approve(accounts[7], 10, {from: accounts[2]});
    await should_throw(async () => {
      await coin.transfer(accounts[3], 1, {from: accounts[2]});
    }, "Blocklist");
    await should_throw(async () => {
      await coin.transferFrom(accounts[2], accounts[1], 1, {from: accounts[7]});
    }, "Blocklist");
    assert.equal(await coin.balanceOf(accounts[1]), 0);
    assert.equal(await coin.balanceOf(accounts[2]), 80);
    assert.equal(await coin.balanceOf(accounts[3]), 20);
    
    await coin.addToBlocklist(accounts[2]);
    await coin.removeFromBlocklist(accounts[2]);
    
    await coin.move(accounts[2], accounts[3], 10);
    await coin.transfer(accounts[3], 1, {from: accounts[2]});
    await coin.transferFrom(accounts[2], accounts[1], 1, {from: accounts[7]});
    assert.equal(await coin.balanceOf(accounts[1]), 1);
    assert.equal(await coin.balanceOf(accounts[2]), 68);
    assert.equal(await coin.balanceOf(accounts[3]), 31);
  });
  
});
