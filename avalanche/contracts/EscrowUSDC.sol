// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVendorPass {
    function isVendor(address) external view returns (bool);
}

contract EscrowUSDC is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status { NONE, FUNDED, RELEASED, REFUNDED }

    struct Order {
        address buyer;
        address vendor;
        uint256 amount; // token amount (6 decimals for USDC)
        Status status;
        uint64 createdAt;
    }

    IERC20 public immutable token; // USDC
    IVendorPass public immutable vendorPass;
    address public feeRecipient;
    uint96 public feeBps; // e.g., 200 = 2%

    mapping(bytes32 => Order) public orders; // orderId => Order

    event OrderCreated(bytes32 indexed orderId, address indexed buyer, address indexed vendor, uint256 amount);
    event Released(bytes32 indexed orderId, address indexed vendor, uint256 amount, uint256 fee);
    event Refunded(bytes32 indexed orderId, address indexed buyer, uint256 amount);

    constructor(address _token, address _vendorPass, address _feeRecipient, uint96 _feeBps, address initialOwner)
        Ownable(initialOwner)
    {
        require(_token != address(0) && _vendorPass != address(0) && _feeRecipient != address(0), "zero addr");
        require(_feeBps <= 1_000, "fee too high");
        token = IERC20(_token);
        vendorPass = IVendorPass(_vendorPass);
        feeRecipient = _feeRecipient;
        feeBps = _feeBps; // 200 = 2%
    }

    function setFee(address recipient, uint96 bps) external onlyOwner {
        require(recipient != address(0) && bps <= 1_000, "bad fee");
        feeRecipient = recipient;
        feeBps = bps;
    }

    function computeId(string calldata orderRef) public view returns (bytes32) {
        return keccak256(abi.encodePacked(msg.sender, orderRef));
    }

    function createOrder(address vendor, uint256 amount, string calldata orderRef) external nonReentrant {
        require(vendor != address(0) && amount > 0, "bad params");
        require(vendorPass.isVendor(vendor), "not vendor");
        bytes32 oid = computeId(orderRef);
        require(orders[oid].status == Status.NONE, "exists");

        orders[oid] = Order({
            buyer: msg.sender,
            vendor: vendor,
            amount: amount,
            status: Status.FUNDED,
            createdAt: uint64(block.timestamp)
        });

        token.safeTransferFrom(msg.sender, address(this), amount);
        emit OrderCreated(oid, msg.sender, vendor, amount);
    }

    function release(bytes32 oid) external nonReentrant {
        Order storage o = orders[oid];
        require(o.status == Status.FUNDED, "not funded");
        require(msg.sender == o.buyer, "only buyer");
        o.status = Status.RELEASED;
        uint256 fee = (o.amount * feeBps) / 10_000;
        uint256 payout = o.amount - fee;
        token.safeTransfer(o.vendor, payout);
        if (fee > 0) token.safeTransfer(feeRecipient, fee);
        emit Released(oid, o.vendor, payout, fee);
    }

    function refund(bytes32 oid) external nonReentrant onlyOwner {
        Order storage o = orders[oid];
        require(o.status == Status.FUNDED, "not funded");
        o.status = Status.REFUNDED;
        token.safeTransfer(o.buyer, o.amount);
        emit Refunded(oid, o.buyer, o.amount);
    }
}
