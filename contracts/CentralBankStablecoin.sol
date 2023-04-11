// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023 Kentaro Hara
//
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php

pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";

//------------------------------------------------------------------------------
//
// CentralBankStablecoin is implemented as ERC20 tokens. The central bank can
// use the smart contract to issue their fiat currency to a public blockchain.
// Historically, the central bank has issued their fiat currency to bank bills
// and metal coins. Isn't it the time to issue their fiat currency to a smart
// contract?
//
// See the whitepapers for more details:
// https://github.com/xharaken/central_bank_stablecoin/blob/main/docs/
//
//------------------------------------------------------------------------------
contract CentralBankStablecoin is ERC20PausableUpgradeable, OwnableUpgradeable {

  // Name of the ERC20 token.
  string public constant NAME = "CentralBankStablecoin";
  
  // Symbol of the ERC20 token.
  string public constant SYMBOL = "CBS";

  // Blocklisted addresses.
  mapping (address => bool) private _blocklist;
  
  // Events.
  event AddToBlocklistEvent(address indexed account);
  event RemoveFromBlocklistEvent(address indexed account);

  // Initializer.
  function initialize()
      public initializer {
    __ERC20Pausable_init();
    __ERC20_init(NAME, SYMBOL);
    __Ownable_init();
  }

  // Mint |amount| coins to the |account|.
  // Only the central bank can call this method.
  function mint(address account, uint amount)
      public onlyOwner {
    _mint(account, amount);
  }

  // Burn |amount| coins from the |account|.
  // Only the central bank can call this method.
  function burn(address account, uint amount)
      public onlyOwner {
    _burn(account, amount);
  }

  // Add the |account| to the blocklist.
  // Only the central bank can call this method.
  function addToBlocklist(address account)
      public onlyOwner {
    _blocklist[account] = true;
    emit AddToBlocklistEvent(account);
  }

  // Remove the |account| from the blocklist.
  // Only the central bank can call this method.
  function removeFromBlocklist(address account)
      public onlyOwner {
    _blocklist[account] = false;
    emit RemoveFromBlocklistEvent(account);
  }

  // Move |amount| coins from the |sender| to the |receiver|.
  // Only the central bank can call this method.
  function move(address sender, address receiver, uint amount)
      public onlyOwner {
    _transfer(sender, receiver, amount);
  }

  // Pause the contract.
  // Only the central bank can call this method.
  function pause()
      public onlyOwner {
    if (!paused()) {
      _pause();
    }
  }
  
  // Unpause the contract.
  // Only the central bank can call this method.
  function unpause()
      public onlyOwner {
    if (paused()) {
      _unpause();
    }
  }

  // Override decimals.
  function decimals()
      public pure override returns (uint8) {
    return 0;
  }

  // Override ERC20's transfer method to validate the blocklist.
  function transfer(address account, uint amount)
      public override returns (bool) {
    require(!_blocklist[_msgSender()], "Blocklist");
    return super.transfer(account, amount);
  }

  // Override ERC20's transferFrom method to validate the blocklist.
  function transferFrom(address from, address to, uint amount)
      public override returns (bool) {
    require(!_blocklist[from], "Blocklist");
    return super.transferFrom(from, to, amount);
  }
}
