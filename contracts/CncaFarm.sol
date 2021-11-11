// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
// import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./CncaToken.sol";

contract CncaFarm is CncaToken, Ownable, ERC20Burnable, ERC20Pausable {

  mapping(address => uint256) public stakingBalance;
  mapping(address => bool) public isStaking;
  mapping(address => uint256) public startTime;
  mapping(address => uint256) public cncaBalance;

  IERC20 public ethToken;
  CncaToken public cncaToken;

  event Stake(address indexed from, uint256 amount);
  event Unstake(address indexed from, uint256 amount);
  event YieldWithdraw(address indexed to, uint256 amount);

   constructor(
      IERC20 _ethToken,
      CncaToken _cncaToken
      ) {
          ethToken = _ethToken;
          cncaToken = _cncaToken;

          _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
          _setupRole(MINTER_ROLE, _msgSender());
          _setupRole(PAUSER_ROLE, _msgSender());
      }

  function _transferOwnership(address newOwner) public onlyOwner {
      transferOwnership(newOwner);
  }

  function decimals() public view virtual override returns (uint8) {
      return 5;
  }

  function mint(address to, uint256 amount) public override virtual {
    require(hasRole(MINTER_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have minter role to mint");
    _mint(to, amount);
  }
  /**
   * @dev Pauses all token transfers.
   *
   * See {ERC20Pausable} and {Pausable-_pause}.
   *
   * Requirements:
   *
   * - the caller must have the `PAUSER_ROLE`.
   */
  function pause() public virtual {
      require(hasRole(PAUSER_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have pauser role to pause");
      _pause();
  }

  function unpause() public virtual {
      require(hasRole(PAUSER_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have pauser role to unpause");
      _unpause();
  }

  function _beforeTokenTransfer(
      address from,
      address to,
      uint256 amount
  ) internal virtual override(ERC20, ERC20Pausable) {
      super._beforeTokenTransfer(from, to, amount);
  }

  function stake(uint256 amount) public {
      require(amount > 0 && ethToken.balanceOf(msg.sender) >= amount, "You cannot stake zero tokens");

      if(isStaking[msg.sender] == true){
          uint256 toTransfer = calculateYieldTotal(msg.sender);
          cncaBalance[msg.sender] += toTransfer;
      }

      ethToken.transferFrom(msg.sender, address(this), amount);
      stakingBalance[msg.sender] += amount;
      startTime[msg.sender] = block.timestamp;
      isStaking[msg.sender] = true;
      emit Stake(msg.sender, amount);
  }

  function unstake(uint256 amount) public {
      require(isStaking[msg.sender] = true && stakingBalance[msg.sender] >= amount, "Nothing to unstake");
      uint256 yieldTransfer = calculateYieldTotal(msg.sender);
      startTime[msg.sender] = block.timestamp;
      uint256 balTransfer = amount;
      amount = 0;
      stakingBalance[msg.sender] -= balTransfer;
      ethToken.transfer(msg.sender, balTransfer);
      cncaBalance[msg.sender] += yieldTransfer;
      if(stakingBalance[msg.sender] == 0){
          isStaking[msg.sender] = false;
      }
      emit Unstake(msg.sender, balTransfer);
  }

  function calculateYieldTime(address user) public view returns(uint256){
      uint256 end = block.timestamp;
      uint256 totalTime = end - startTime[user];
      return totalTime;
  }

  function calculateYieldTotal(address user) public view returns(uint256) {
      uint256 time = calculateYieldTime(user) * 10**18;
      uint256 rate = 86400;
      uint256 timeRate = time / rate;
      uint256 rawYield = (stakingBalance[user] * timeRate) / 10**18;
      return rawYield;
  }

  function withdrawYield() public {
      uint256 toTransfer = calculateYieldTotal(msg.sender);
      require(toTransfer > 0 || cncaBalance[msg.sender] > 0, "Nothing to withdraw");

      if(cncaBalance[msg.sender] != 0){
          uint256 oldBalance = cncaBalance[msg.sender];
          cncaBalance[msg.sender] = 0;
          toTransfer += oldBalance;
      }

      startTime[msg.sender] = block.timestamp;
      cncaToken.mint(msg.sender, toTransfer);
      emit YieldWithdraw(msg.sender, toTransfer);
  }
}